import { Component, ElementRef, Input, Signal, ViewChild, viewChild, viewChildren } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextAreaComponent } from '../../components/text-area/text-area.component';
import {Java_JSOutputStream_jsWrite, JavaOutputComponent} from '../../components/java-output/java-output.component';
import {Extension, EditorState} from "@codemirror/state"
import {
  EditorView, keymap, highlightSpecialChars, drawSelection,
  highlightActiveLine, dropCursor, rectangularSelection,
  crosshairCursor, lineNumbers, highlightActiveLineGutter
} from "@codemirror/view"
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from "@codemirror/language"
import {
  defaultKeymap, history, historyKeymap
} from "@codemirror/commands"
import {
  searchKeymap, highlightSelectionMatches
} from "@codemirror/search"
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap
} from "@codemirror/autocomplete"
import {lintKeymap} from "@codemirror/lint"
import {java} from "@codemirror/lang-java"


declare var cheerpjInit: any;
declare var cheerpjRunMain: any;
declare var cheerpOSAddStringFile:any;


class Status
{
  private _buttonStatus:string ="Initializing";
  private _additionalStatus:string = "";
  private _compilationAllowed:boolean = false;

  get buttonStatus() {return this._buttonStatus;}
  get additionalStatus(){return this._additionalStatus;}
  get compileButtonDisabled(){return !this._compilationAllowed;}

  public setStatus(status:string, isAdditional:boolean, compilationAllowed?:boolean):void
  {
    if(compilationAllowed == undefined)
    {
      compilationAllowed = isAdditional;
    }

    this._compilationAllowed = compilationAllowed;

    if(isAdditional)
    {
      this._additionalStatus = status;
      this._buttonStatus = "Compile";
      return;
    }

    this._additionalStatus="";
    this._buttonStatus=status;
    
  }
}

@Component({
  selector: 'app-code-editor',
  imports: [MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    JavaOutputComponent],
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.css'
})
export class CodeEditorComponent 
{

  @Input() height = '';

  private _status:Status = new Status();
  get status() {return this._status;}
  


  @ViewChild(JavaOutputComponent)output!:JavaOutputComponent;

  // code mirror
  @ViewChild('codeMirrorInsert') codeMirrorInsert!:ElementRef;
  codeMirrorView! :EditorView;




  ngOnInit()
  {
   
    this.init();
  }
  
  ngAfterViewInit()
  {
    
    this.codeMirrorView = new EditorView({
      // starting code. Garbage format, I know, but temporary (hopefully).
      doc: `public class Lab\n{\n\tpublic static void main(String[] args)\n\t{\n\t\tSystem.out.println(\"Hello, world! \\nThis is from java!\");
    }\n}`,
      parent: this.codeMirrorInsert.nativeElement,
      extensions: [  // A line number gutter
        lineNumbers(),
        // A gutter with code folding markers
        foldGutter(),
        // Replace non-printable characters with placeholders
        highlightSpecialChars(),
        // The undo history
        history(),
        // Replace native cursor/selection with our own
        drawSelection(),
        // Show a drop cursor when dragging over the editor
        dropCursor(),
        // Allow multiple cursors/selections
        EditorState.allowMultipleSelections.of(true),
        // Re-indent lines when typing specific input
        indentOnInput(),
        // Highlight syntax with a default style
        syntaxHighlighting(defaultHighlightStyle),
        // Highlight matching brackets near cursor
        bracketMatching(),
        // Automatically close brackets
        closeBrackets(),
        // Load the autocompletion system
        autocompletion(),
        // Allow alt-drag to select rectangular regions
        rectangularSelection(),
        // Change the cursor to a crosshair when holding alt
        crosshairCursor(),
        // Style the current line specially
        highlightActiveLine(),
        // Style the gutter for current line specially
        highlightActiveLineGutter(),
        // Highlight text that matches the selected text
        highlightSelectionMatches(),
        keymap.of([
          // Closed-brackets aware backspace
          ...closeBracketsKeymap,
          // A large set of basic bindings
          ...defaultKeymap,
          // Search-related keys
          ...searchKeymap,
          // Redo/undo keys
          ...historyKeymap,
          // Code folding bindings
          ...foldKeymap,
          // Autocompletion keys
          ...completionKeymap,
          // Keys related to the linter system
          ...lintKeymap
      ]),
      java()
      ]
    })
  }



  private async init()
  {
    // actually init cheerpj.
    await cheerpjInit( {natives: { Java_JSOutputStream_jsWrite }}  );

    // this just deletes files from previous code compilations. It's not strictly needed, really.
    let val = await cheerpjRunMain(
        "Main",
        "/app/java/ClearFiles.jar",
    );
    if(await val !== 0)
    {
        alert("Initialization failed.");
        return;
    }
  
    this._status.setStatus("", true, true);
 
  } 

  public async compile()
  {

    this.output!.clear();  
    
    // paths here 
    let javaFile:String = "/str/Lab.java";
    let classFile:String = "Lab.class";
    let jarFile:String = "/files/Lab.jar";

    cheerpOSAddStringFile(javaFile, this.codeMirrorView.state.doc.toString());
  

    if(!await this.compileJava(javaFile))
    {
      return;
    }  

    if(!await this.CreateExecutableJar(classFile, jarFile))
    {
      return;
    }  

    this._status.setStatus("Running Program", false);
    let retVal = await cheerpjRunMain(
        "LabLauncher",
        jarFile,
    );


    this._status.setStatus("Returned with code "+await retVal, true);

  }


  private async compileJava(javaFile:String) : Promise<boolean>
  {
   
    this.status.setStatus("Compiling", false);
    let retVal = await cheerpjRunMain(
      "JavaCLauncher",
      "/app/java/tools_modified.jar",
      // args
      "-d",
      "/files/",
      javaFile,
      "/app/java/LabLauncher.java",
      "/app/java/JSOutputStream.java"
    );
    if(await retVal !== 0)
    {
      this.status.setStatus("Compilation Failed", true);
      return false;
    }

    return true;
  }

  // creates a jar file from clas files.
  private async CreateExecutableJar(classFile:String, jarFile:String) : Promise<boolean>
  {
    this._status.setStatus( "Making Jar", false);
    let retVal = await cheerpjRunMain(
        "sun.tools.jar.Main",
        "/app/java/tools_modified.jar",
        // args
        "-cf",  "/files/Lab.jar",
        "-C", "/files",
        classFile,
        "LabLauncher.class",
        "JSOutputStream.class"
    );

    if(await retVal !== 0)
    {
        this._status.setStatus("Failed to make Jar.", true);
        return false;
    }

    return true;
  }
}
