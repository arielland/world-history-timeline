import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, ElementRef, OnInit, Inject } from '@angular/core'
import { HttpClient } from '@angular/common/http';

declare var vis: any;


export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'timeline-example',
  template: `
    <div>
      <section class='checkboxes' *ngFor="let tag of domTags; let i = index;">
        <mat-checkbox class="example-margin" [(ngModel)]="tag.selected" (click)="updateTimelineByTags(tag.selected, tag.items)">{{tag.name}}</mat-checkbox>
         </section>
    </div>
    <div id="visualization" style="position: relative;"></div>
    <span id="decode-place-holder"></span>
  `,
  styles: [`
    #decode-place-holder {display: none;}
    .checkboxes {display: inline-block;margin: 0 10px;}
    #visualization {box-shadow: 3px 3px 30px rgb(191, 191, 191) inset;}    
  `]
})

export class VisTimelineExampleComponent implements OnInit {
  public timeline: any;
  public tags: any; //vis.DataSet
  public tagsDataView: any; //vis.DataView
  public items: any = new vis.DataSet();
  public groups: any[] = [];
  public domTags: any[] = []; 
  public nestedGroups: any[] = [];
  public displayedItemIds: any[] = [];
  timeLineData = 'assets/test_content_demo_test.csv';
  timeLineDataTags = 'assets/test_content_demo_test_tags.csv';
  name: string = 'History Time-Line';

  _tagList: string[];
  get tagList(): string[] {
    return this._tagList;
  }
  set tagList(value: string[]) {
    this._tagList = value;
    this.filteredTags = this.tagList ? this.filterTags(this.tagList) : this.tags;
  }
  filteredTags: string[];
  constructor(private element: ElementRef, private http: HttpClient, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.http.get(this.timeLineData, { responseType: 'text' }).subscribe(result => {
      this.getObjectArrFromCsv(result);
      this.timelineInit();
    }, error => console.error(error));

    this.http.get(this.timeLineDataTags, { responseType: 'text' }).subscribe(result => {
      this.getTagsArrFromCsv(result);
    }, error => console.error(error));

  }
  public updateTimelineByTags(isSelected, items) {
    if (!isSelected) {
      for (var i = 0; i < items.length; i++) {
        if (this.displayedItemIds.indexOf(items[i]) < 0) {
          this.displayedItemIds.push(items[i].id);
        }
      }
    }
    else {
      for (var i = 0; i < items.length; i++) {
        let itemIndex = this.displayedItemIds.indexOf(items[i].id);
        if (itemIndex > -1) {
          this.displayedItemIds.splice(itemIndex, 1);
        }
      }
    }
    let itemArray = [];
    for (var i = 0; i < this.displayedItemIds.length; i++) {
      itemArray.push(this.items.get(this.displayedItemIds[i]));
    }
    let filteredItems = new vis.DataSet(itemArray);
    this.timeline.setItems(filteredItems)
  }
  public filterTags(tags: string[]): string[] {
    return [];
    //return this.tags.filer((tag: string) =>
    //  tag.toLowerCase().indexOf !== -1));
  }
  public getObjectArrFromCsv(csv) {
    let lines = csv.split("\n");
    let headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {
      let obj = {};
      let currentline = lines[i].split(",");

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = this.isNegativeNumber(currentline[j]) ?
          new Date(parseInt(currentline[j]), 0, 0) :
          currentline[j];
      }
      //"validation..."
      if (this.isValidObject(obj)) {
        //is group?
        if (obj["type"] === "group") {
          this.addToGroupsAndNestedGroups(obj);
        }
        //is item
        else {
          this.items.add(obj);
        }
      }
    }
  }
  public getTagsArrFromCsv(csv) {    
    let lines = csv.split("\n");
    let headers = lines[0].split(",");
    let tempTags = [];
    let startFrom = 0;
    let endAt = 0;
    //set tags with empty 'items' array
    for (let i = 0; i < headers.length; i++) {
      if (this.isTagNameHeader(headers[i])) {
        tempTags[i] = { id: i, name: headers[i], items: [], selected: true };
        startFrom = startFrom > 0 ? startFrom : i;// make sure this is the starting index
        endAt = i > endAt ? i : endAt;//make sure this is the ending index
      }
    }

    for (let i = 1; i < lines.length; i++) {
      let currentline = lines[i].split(",");
      let itemId = 0;

      for (let j = 0; j < headers.length; j++) {
        //id == itemId
        if (headers[j] === "id") {
          itemId = currentline[j];
        }
        else if (headers[j] !== "content" && itemId > 0 && currentline[j] !== "") {
          tempTags[j].items.push({ id: itemId });
        }        
      }
    }
    //error, since tempTags[0] === undefined (starts from index 2..., so:)
    for (let i = startFrom; i <= endAt; i++) {
      if (tempTags[i] !== undefined) {
        this.domTags.push(tempTags[i]);
      }
    }
    this.tags = new vis.DataSet(this.domTags);
  }
  public isTagNameHeader(header) {
    return header !== "id" && header !== "content";
  }
  public isValidObject(obj) {
    return obj["id"] !== '"' && obj["id"] !== '';
  }
  public isNegativeNumber(text) {
    try {
      var number = parseInt(text);
      return number < 0;
    }
    catch { return false; }
  }
  public addToGroupsAndNestedGroups(obj) {
    let hasParentGroup = obj["group"] > 0;
    let groupObj = {
      "id": parseInt(obj["id"]),
      "content": obj["content"],
      "title": obj["content"],
      "visible": true,
      "showNested": true,
      "treeLevel": hasParentGroup ? 2 : 1
    };
    this.groups.push(groupObj);
    //nested groups
    if (hasParentGroup) {
      this.addGroupToNestedGroups(obj);
    }
  }
  public addGroupToNestedGroups(obj) {
    this.nestedGroups.push({ "id": parseInt(obj["id"]), "parentId": parseInt(obj["group"]) });
  }
  public addNestedGroups(groupsDataSet) {
    for (let z = 0; z < this.nestedGroups.length; z++) {
      let nestedGroup = this.nestedGroups[z];
      groupsDataSet.forEach(function (group) {
        if (group["id"] === nestedGroup["parentId"]) {
          let nestedGroupId = parseInt(nestedGroup["id"]);
          let nestedGroupsArray = group["nestedGroups"];
          if (nestedGroupsArray === undefined) {
            nestedGroupsArray = [nestedGroupId];
          }
          else {
            nestedGroupsArray.push(nestedGroupId);
          }
          groupsDataSet.update({
            id: group.id,
            "nestedGroups": nestedGroupsArray
          });
        }
      })
    }
    return groupsDataSet;
  }
  public timelineInit() {
    let container = document.getElementById("visualization");
    // Create a DataSet (allows two way data-binding)
    //let items = new vis.DataSet(this.items);
    this.displayedItemIds = this.items.getIds();
    //let view = new vis.DataView(items, {
    //  filter: function (item) { return this.displayedItemIds.indexOf(item.id) > -1 }
    //});
    // Configuration for the Timeline
    let options = {
      rtl: true//,
      //configure: function (option, path) {
      //  return option === 'format' || path.indexOf('format') !== -1;
      //},
      //stack: true,
      //verticalScroll: true,
      //zoomKey: 'ctrlKey',
      //height: 600
    };
    if (this.groups.length > 0) {

      let groupsDataSet = new vis.DataSet();
      groupsDataSet.add(this.groups);
      groupsDataSet = this.addNestedGroups(groupsDataSet)
      // Create a Timeline
      this.timeline = new vis.Timeline(container, this.items, groupsDataSet, options);

    }
    else {
      // Create a Timeline
      this.timeline = new vis.Timeline(container, this.items, options);
    }
    this.setEventListners();
  }
  public onSelectTag() {
    //this.timeLine.setItems(items)
  }
  public setEventListners() {
    //this.timeline.on('select', function (properties) {
    //  alert('selected items: ' + properties.items);
    //});
    this.timeline.on('doubleClick', (properties) => this.onDoubleClick(properties.what, properties.item));
  }
  public onDoubleClick(what, id) {
    if (what === "item") {
      let item = this.items.get(id);
      this.openDialog(item);
    }
  }
  public openDialog(selectedObj): void {
    const dialogRef = this.dialog.open(ItemContentDialog, {
      width: '250px',
      data: { name: selectedObj.content, books: selectedObj.books, start: selectedObj.start, end: selectedObj.end, title: selectedObj.title }
    });

    //dialogRef.afterClosed().subscribe(result => {
    //  console.log('The dialog was closed');
    //  //this.animal = result;
    //});
  }
}


@Component({
  selector: 'item-content-dialog',
  template: `
    <h1 mat-dialog-title>{{data.name}}</h1>
    <div mat-dialog-content>
      <mat-label>: ספרים</mat-label>
      <div>{{data.books}}</div>
      <br/>
      <mat-label>: שנים</mat-label>
      <div>{{data.start}} - {{data.end}}</div>
      <div>{{data.title}}</div>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCloseClick()">Close</button>
    </div>
  `,
})

export class ItemContentDialog {

  constructor(
    public dialogRef: MatDialogRef<ItemContentDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onCloseClick(): void {
    this.dialogRef.close();
  }

}
//TRYING TO FIX NESTED GROUPS ISSUES

//import { Component, ElementRef, OnInit } from '@angular/core'
//import { HttpClient } from '@angular/common/http';

//declare var vis: any;

//@Component({
//  selector: 'timeline-example',
//  template: `
//    <div>
//      <h2>Hello {{name}}</h2>
//    </div>
//    <div id="visualization" style="position: relative;"></div>
//    <span id="decode-place-holder"></span>
//  `,
//  styles: ['#decode-place-holder {display: none;}',
//    'body,html { font- family: arial, sans - serif; font- size: 11pt;} #visualization { box - sizing: border - box; width: 100 %; height: 300px;}']
//})

//export class VisTimelineExampleComponent implements OnInit {
//  public items: any[];
//  public groups: any[];
//  public nestedGroups: any[];
//  public testText: string;
//  public testGroups: any[];
//  timeLineData = 'assets/test_content_demo_test.csv';
//  name: string;
//  constructor(private element: ElementRef, private http: HttpClient) {
//    this.name = 'Angular2';
//    this.items = [];
//    this.groups = [];
//    this.nestedGroups = [];
//    this.testText = "";
//    this.testGroups = [
//      { id: 1, content: 'אירועים היסטוריים', title: 'אירועים היסטוריים' },
//      { id: 2, content: 'שס והלכה', title: 'שס והלכה', nestedGroups: [3, 4, 5] },
//      { id: 3, content: 'א ר צ ו ת   ה א ס ל א ם ס פ ר ד ', title: 'א ר צ ו ת   ה א ס ל א ם ס פ ר ד ', },
//      { id: 4, content: 'א י ט ל י ה    פ ר ו ב נ ס  ב ב ל ', title: 'א י ט ל י ה    פ ר ו ב נ ס  ב ב ל ', },
//      { id: 5, content: 'פולין גרמניה א ר צ ו ת   א ש כ נ ז   (צרפת ליטא...)', title: 'פולין גרמניה א ר צ ו ת   א ש כ נ ז   (צרפת ליטא...)', },
//      { id: 6, content: 'מפרשי תנך', title: 'מפרשי תנך', nestedGroups: [7, 8, 9] },
//      { id: 7, content: 'ס פ ר ד', title: 'ס פ ר ד', },
//      { id: 8, content: ' איטליה פרובנס בבל', title: ' איטליה פרובנס בבל', },
//      { id: 9, content: 'פולין גרמניה א ר צ ו ת   א ש כ נ ז   (צרפת  ליטא...)', title: 'פולין גרמניה א ר צ ו ת   א ש כ נ ז   (צרפת  ליטא...)', },
//      { id: 10, content: 'הוגים - חלקי', title: 'הוגים - חלקי', nestedGroups: [11, 12, 13] },
//      { id: 11, content: 'ס פ ר ד', title: 'ס פ ר ד', },
//      { id: 12, content: 'א י ט ל י ה    פ ר ו ב נ ס  ב ב ל ', title: 'א י ט ל י ה    פ ר ו ב נ ס  ב ב ל ', },
//      { id: 13, content: 'א ר צ ו ת   א ש כ נ ז', title: 'א ר צ ו ת   א ש כ נ ז', },
//      { id: 14, content: 'כללי', title: 'כללי', }
//    ];
//  }

//  ngOnInit() {
//    this.http.get(this.timeLineData, { responseType: 'text' }).subscribe(result => {
//      this.getObjectArrFromCsv(result);
//      this.timelineInitGroupsTest();
//    }, error => console.error(error));
    
//  }
//  public getObjectArrFromCsv(csv) {
//    let lines = csv.split("\n");
//    let headers = lines[0].split(",");

//    for (let i = 1; i < lines.length; i++) {
//      let obj = {};
//      let currentline = lines[i].split(",");

//      for (let j = 0; j < headers.length; j++) {
//        obj[headers[j]] = this.isNegativeNumber(currentline[j]) ?
//          new Date(parseInt(currentline[j]), 0, 0) :
//          currentline[j];
//      }
//      //"validation..."
//      if (this.isValidObject(obj)) {
//        //is group?
//        if (obj["type"] === "group") {
//          this.addToGroupsAndNestedGroups(obj);
//        }
//        //is item
//        else {
//          this.items.push(obj);
//        }
//      }
//    }
//  }
//  public isValidObject(obj) {
//    return obj["id"] !== '"' && obj["id"] !== '';
//  }
//  public isNegativeNumber(text) {
//    try {
//      var number = parseInt(text);
//      return number < 0;
//    }
//    catch { return false; }
//  }
//  public addToGroupsAndNestedGroups(obj) {
//    let hasParentGroup = obj["group"] > 0;
//    let groupObj = {
//      "id": parseInt(obj["id"]),
//      "content": obj["content"],
//      "title": obj["content"],
//      "visible": true,
//      "showNested": true,
//      "treeLevel": hasParentGroup ? 2 : 1
//    };
//    this.groups.push(groupObj);
//    //nested groups
//    if (hasParentGroup) {
//      this.addGroupToNestedGroups(obj);
//    }
//  }
//  public testStringGroups(groups) {
//    let testText = "var groupsTest = [";
//    groups.forEach(function (group) {
//      testText += "{ id: " + group.id;
//      testText += ", content: '" + group.content;
//      testText += "', title: '" + group.title;
//      testText += "', visible: " + group.visible;
//      testText += ", showNested: " + group.showNested;
//      testText += ", treeLevel: " + group.treeLevel;
//      if (group.nestedGroups !== undefined) {
//        testText += ", nestedGroups: [ " + group.nestedGroups + " ] ";
//      }      
//      testText += "}, ";
//    });
//    testText += "];";
//    return testText;
//  }
//  public addGroupToNestedGroups(obj) {
//    this.nestedGroups.push({ "id": parseInt(obj["id"]), "parentId": parseInt(obj["group"]) });
//  }
//  public addNestedGroups(groupsDataSet) {
//    for (let z = 0; z < this.nestedGroups.length; z++) {
//      let nestedGroup = this.nestedGroups[z];
//      groupsDataSet.forEach(function (group) {
//        if (group["id"] === nestedGroup["parentId"]) {
//          let nestedGroupId = parseInt(nestedGroup["id"]);
//          let nestedGroupsArray = group["nestedGroups"];
//          if (nestedGroupsArray === undefined) {
//            nestedGroupsArray = [nestedGroupId];
//          }
//          else {
//            nestedGroupsArray.push(nestedGroupId);
//          }
//          groupsDataSet.update({
//            id: group.id,
//            "nestedGroups": nestedGroupsArray
//          });
//        }
//      })
//    }
//  }
//  public timelineInit() {
//    let container = document.getElementById("visualization");
//    // Create a DataSet (allows two way data-binding)
//    let items = new vis.DataSet(this.items);

//    // Configuration for the Timeline
//    let options = {
//      rtl: true,
//      stack: true,
//      verticalScroll: true,
//      //zoomKey: 'ctrlKey',
//      //height: 600
//    };
//    if (this.groups.length > 0) {
//      let groupsDataSet = new vis.DataSet(this.groups);
//      this.addNestedGroups(groupsDataSet)
      
//      let testGroupsText = this.testStringGroups(groupsDataSet);
//      let finalGroups = new vis.DataSet();
//      finalGroups.add(this.testGroups);
//      // Create a Timeline
//      let timeline = new vis.Timeline(container, items, finalGroups, options);

//    }
//    else {
//      // Create a Timeline
//      let timeline = new vis.Timeline(container, items, options);
//    }
//  }
//  public timelineInitGroupsTest() {
//    var sdt = [
//      {
//        group3: [
//          {
//            id: 1243,
//            treeLevel: 3,
//            content: "Level 3 1243",
//          },
//          {
//            id: 1525,
//            treeLevel: 3,
//            content: "Level 3 1525",
//          },
//          {
//            id: 1624,
//            treeLevel: 3,
//            content: "Level 3 1624",
//          },
//          {
//            id: 2076,
//            treeLevel: 3,
//            content: "Level 3 2076",
//          },
//          {
//            id: 1345,
//            treeLevel: 3,
//            content: "Level 3 1345",
//          },
//          {
//            id: 2078,
//            treeLevel: 3,
//            content: "Level 3 2078",
//          },
//          {
//            id: 1826,
//            treeLevel: 3,
//            content: "Level 3 1826",
//          },
//          {
//            id: 2107,
//            treeLevel: 3,
//            content: "Level 3 2107",
//          },
//        ],
//        groups: [
//          {
//            id: 10,
//            title: "Group 10",
//            content: "Group 10",
//            treeLevel: 1,
//            nestedGroups: [1, 2, 3, 4, 5, 6],
//          },
//          {
//            id: 1,
//            content: "North America",
//            treeLevel: 2,
//            nestedGroups: [1243, 1525, 1624, 1345, 2078, 1826, 2076, 2107],
//          },
//          {
//            id: 2,
//            treeLevel: 2,
//            content: "Latin America",
//          },
//          {
//            id: 3,
//            treeLevel: 2,
//            content: "Europe",
//          },
//          {
//            id: 4,
//            treeLevel: 2,
//            content: "Asia",
//          },
//          {
//            id: 5,
//            treeLevel: 2,
//            content: "Oceania",
//          },
//          {
//            id: 6,
//            treeLevel: 2,
//            content: "Africa",
//          },
//          {
//            id: 100,
//            title: "Group 100",
//            content: "Group 100",
//            treeLevel: 1,
//            nestedGroups: [101, 102, 103, 104, 105, 106],
//            text: "Totals",
//            EditionId: 0,
//            groupId: 0,
//          },
//          {
//            id: 101,
//            treeLevel: 2,
//            content: "North America",
//          },
//          {
//            id: 102,
//            treeLevel: 2,
//            content: "Latin America",
//          },
//          {
//            id: 103,
//            treeLevel: 2,
//            content: "Europe",
//          },
//          {
//            id: 104,
//            treeLevel: 2,
//            content: "Asia",
//          },
//          {
//            id: 105,
//            treeLevel: 2,
//            content: "Oceania",
//          },
//          {
//            id: 106,
//            treeLevel: 2,
//            content: "Africa",
//          },
//        ],
//      },
//    ];

//    function randomIntFromInterval(min, max) {
//      return Math.floor(Math.random() * (max - min + 1) + min);
//    }

//    let startDay = new Date(2000, 1,1);

//    // DOM element where the Timeline will be attached
//    var container = document.getElementById("visualization");

//    // Create a DataSet (allows two way data-binding)
//    //var items = new vis.DataSet(data.result);

//    var now = new Date(2020, 1, 1);
//    var itemCount = 60;

//    // create a data set with groups
//    var groups = new vis.DataSet();

//    groups.add(sdt[0].groups);
//    groups.add(sdt[0].group3);

//    // create a dataset with items
//    var items = new vis.DataSet();
//    var groupIds = groups.getIds();
//    var types = ["box", "point", "range", "background"];
//    for (var i = 0; i < itemCount; i++) {
//      var rInt = randomIntFromInterval(1, 30);
//      var start = startDay.setDate(rInt);
//      var end = startDay.setHours(24);
//      var randomGroupId = groupIds[randomIntFromInterval(1, groupIds.length)];
//      var type = types[randomIntFromInterval(0, 3)];

//      items.add({
//        id: i,
//        group: randomGroupId,
//        content: "item " + i + " " + rInt,
//        start: start,
//        end: end,
//        type: type,
//      });
//    }

//    // specify options
//    let options = {
//      start: startDay,
//      end: new Date(1000 * 60 * 60 * 24 + new Date().valueOf()),
//      //horizontalScroll: true,
//      zoomKey: "ctrlKey",
//      orientation: "both",
//      zoomMin: 1000 * 60 * 60 * 240,
//    };

//    // create a Timeline
//    var timeline = new vis.Timeline(container, items, groups, options);

//  }
//  public randomIntFromInterval(min, max) {
//    return Math.floor(Math.random() * (max - min + 1) + min);
//  }
//}

//END - NESTED GROUP ISSUES



//import { Component, OnDestroy, OnInit } from '@angular/core';

//import { VisTimelineService, DataItem } from '../../../node_modules/vis-timeline/dist/types';

//@Component({
//  selector: 'timeline-example',
//  template: `
//    <h2>Timeline</h2>
//    <h3>Basic usage</h3>
//    <div [visTimeline]="visTimeline" [visTimelineItems]="visTimelineItems" (initialized)="timelineInitialized()"></div>
//    <button type="button" class="btn btn-default" (click)="addItem()">Add and focus</button>
//    <p><strong>Note:</strong> Open your dev tools to see the console output when the timeline receives click events.</p>
//  `
//})
//export class VisTimelineExampleComponent implements OnInit, OnDestroy {
//  public visTimeline: string = 'timelineId1';
//  public visTimelineItems: DataItem[];

//  public constructor(private visTimelineService: VisTimelineService) {}

//  public timelineInitialized(): void {
//    console.log('timeline initialized');

//    // now we can use the service to register on events
//    this.visTimelineService.on(this.visTimeline, 'click');

//    // open your console/dev tools to see the click params
//    this.visTimelineService.click.subscribe((eventData: any[]) => {
//      if (eventData[0] === this.visTimeline) {
//        console.log(eventData[1]);
//      }
//    });
//  }

//  public addItem(): void {
//    const newLength = this.visTimelineItems.length + 1;
//    this.visTimelineItems.push({ id: newLength, content: 'item ' + newLength, start: Date.now() });
//    this.visTimelineService.setItems(this.visTimeline, this.visTimelineItems);
//    this.visTimelineService.focusOnIds(this.visTimeline, [1, newLength]);
//  }

//  public ngOnInit(): void {
//    this.visTimelineItems = [
//      { id: 1, content: 'item 1', start: '2016-04-20' },
//      { id: 2, content: 'item 2', start: '2017-04-14' },
//      { id: 3, content: 'item 3', start: '2017-04-18' },
//      { id: 4, content: 'item 4', start: '2018-04-16', end: '2016-04-19' },
//      { id: 5, content: 'item 5', start: '2018-04-25' },
//      { id: 6, content: 'item 6', start: '2019-04-27', type: 'point' }
//    ];
//  }

//  public ngOnDestroy(): void {
//    this.visTimelineService.off(this.visTimeline, 'click');
//  }
//}
