import { Component, inject, Input, OnInit, signal, Signal, ViewChild } from '@angular/core';
import { Java_JSOutputStream_jsWrite, JavaOutputComponent } from '../java-output/java-output.component';
import { MatButtonModule } from '@angular/material/button';
import { Status } from './Status';
import { DomSanitizer } from '@angular/platform-browser';
import { LabCompiler } from './LabCompiler';
import { LocalStorageService } from '../../services/local-storage.service';
import { ActivatedRoute } from '@angular/router';

declare let cheerpjInit: any;
declare let cheerpjRunMain: any;
declare let cheerpOSAddStringFile:any;

let LabLauncher:any = null;
export async function Java_LabLauncher_callJS(lib:any /*: CJ3Library*/,self:any /*java object???*/)
{
  LabLauncher = self;
  return new Promise(() => {}); // Keeps the function from returning
}

@Component({
  selector: 'app-code-control',
  imports: [JavaOutputComponent, MatButtonModule],
  templateUrl: './code-control.component.html',
  styleUrl: './code-control.component.css'
})

export class CodeControlComponent implements OnInit
{
    private _status:Status = new Status();
    
    constructor(
      private _route: ActivatedRoute,
      private localStorage: LocalStorageService
    ) {}

    get status() {return this._status;}

    @ViewChild(JavaOutputComponent)output!:JavaOutputComponent;

    public getCode!:() => string;
    
    private compiler!:LabCompiler;

    private launcherName = "PlaygroundLauncher";
    private testCasesPath = "";
    private isPlayground:boolean = true;

    public moduleNumber = signal<string>("");
    public assignmentNumber = signal<string>("");
    public activityPassed = signal<boolean>(false);


    public getActivityPassed() : boolean {
      return this.activityPassed();
    }
    
    public setLauncherClass(value:string)
    {
      this.isPlayground = false;
      this.launcherName = value;
      if(this.compiler !== undefined)
        this.compiler.LauncherName = value;
    }

    public setTestCases(file:string)
    {
      this.testCasesPath = "/app/test-cases/"+file;
    }

    async ngOnInit()
    {  
      const id = this._route.snapshot.paramMap.get('id');
      const assignmentNumber = this._route.snapshot.paramMap.get('assignmentNumber');

      this.moduleNumber.set(id!);
      this.assignmentNumber.set(assignmentNumber!);
      this.init();

      if (this.localStorage.getActivityStatus(this.moduleNumber(), this.assignmentNumber())){
        this.activityPassed.set(true);
      }
    }

    private async init()
    {
      // actually init cheerpj.
      await cheerpjInit( {natives: { Java_JSOutputStream_jsWrite, Java_LabLauncher_callJS }}  );
  
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
    
      // This fetches some java files we will need to compile the user's program. 
      this.compiler = new LabCompiler(this._status, this.launcherName);
      console.log("Created LabCompiler");
    
      this._status.setStatus("", true, true);
    } 

    public async mainButton()
    {
      if(!this._status.programRunning)
      {
        this.runJava();
        return;
      }

      // stop the program.
      this._status.programRunning = false;
      this._status.setStatus("Program Stopped", true);
      LabLauncher?.end();
    }

    public async runJava()
    {
      this.output!.clear();  
      
      if(!await this.compiler.compile(this.getCode()))
      {
        return;
      }

      this._status.setStatus("Stop Program", false, true);
      this._status.programRunning = true;

      let retVal = await cheerpjRunMain(
          this.launcherName,
          "/files/Lab.jar",
          this.testCasesPath
      );
      this._status.programRunning = false;

      if(this.isPlayground)
      {
        this._status.setStatus("Returned with code "+await retVal, true);
        return;
      }
      
      if((await retVal) == 0)
      {
        this.localStorage.writeProgress(this.moduleNumber(), this.assignmentNumber())
        this.localStorage.writeCode(this.moduleNumber(), this.assignmentNumber(), this.getCode());
        this._status.setStatus("Activity Complete! Good job.", true);
        this.activityPassed.set(true);
        this._status.setStatusClass("good");
        
      }
      else
      {
        // this.localStorage.writeCode(this.moduleNumber(), this.assignmentNumber(), this.getCode());
        this._status.setStatus("Hmm. That's not quite what we were looking for.", true);
        this._status.setStatusClass("error");
      }
    }
}
