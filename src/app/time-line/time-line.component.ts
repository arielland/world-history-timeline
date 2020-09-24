//import { TimeLineService } from './time-line.service';
import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-time-line',
  templateUrl: './time-line.component.html'
})
export class TimeLineComponent {
  public model: any[];
  timeLineData = 'csv/test_content_demo.csv';

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string) {//, timeline: TimeLineService
    http.get(baseUrl + this.timeLineData, { responseType: 'text' }).subscribe(result => {
      this.model = this.getObjectArrFromCsv(result);
    }, error => console.error(error));


  }

  public getObjectArrFromCsv(csv) {
    let lines = csv.split("\n");
    let result = [];
    let headers = lines[0].split(",");
    for (let i = 1; i < lines.length; i++) {
      let obj = {};
      let currentline = lines[i].split(",");

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);
    }

    return result; 
  }

  public csvJSON(csv) {
    let lines = csv.split("\n");

    let result = [];

    let headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {

      let obj = {};
      let currentline = lines[i].split(",");

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);

    }

    //return result; //JavaScript object
    return JSON.stringify(result); //JSON
  }
}

interface DynamicContainerModel {
  items: string;
  groups: number;
  additionalInfo: number;
}
