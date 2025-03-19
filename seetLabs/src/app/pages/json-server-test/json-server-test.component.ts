import { Component, inject, signal, OnInit } from '@angular/core';
import { JsonServerTestService } from '../../services/json-server-test.service';
import { catchError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { exampleType } from '../../models/exampleModel.types';

@Component({
  selector: 'app-json-server-test',
  imports: [],
  templateUrl: './json-server-test.component.html',
  styleUrl: './json-server-test.component.scss'
})
export class JsonServerTestComponent implements OnInit {

  constructor(private _route: ActivatedRoute) {}

  getDataService = inject(JsonServerTestService);
  jsonData = signal<exampleType>({ 'id': 0, 'title': '', 'views': 0});

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    this.getDataService.getDataFromAPI(id).pipe(
      catchError((err) => {
        console.log(err);
        throw err;
      })
    ).subscribe((data) => {
      this.jsonData.set(data);
    });
  }

}
