import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { exampleType } from '../models/exampleModel.types';

@Injectable({
  providedIn: 'root'
})
export class JsonServerTestService {
  
  http = inject(HttpClient)

  getDataFromAPI(id: string | null){
    const url = `http://localhost:3000/posts/${id}`;
    return this.http.get<exampleType>(url, {responseType: 'json'});
  }

}