import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { fromEvent, interval } from 'rxjs';
import { switchMap, takeUntil, pairwise, bufferTime} from 'rxjs/operators';
import { SocketioService } from '../../services/common/socketio.service';

@Component({
  selector: 'app-whiteboard-canvas',
  templateUrl: './whiteboard-canvas.component.html',
  styleUrls: ['./whiteboard-canvas.component.scss']
})
export class WhiteboardCanvasComponent implements OnInit {

  constructor(private socketService: SocketioService) { }

  ngOnInit(): void {
    this.socketService.setupSocketConnection();

    this.socketService.socket.on('draw-sync', (data: any) => {
      this.drawSync(data);
    });
  }

  @ViewChild('canvas') public canvas: ElementRef;

  // setting a width and height for the canvas
  @Input() public width = 400;
  @Input() public height = 400;
  private cx: CanvasRenderingContext2D;

  public ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.width;
    canvasEl.height = this.height;

    // set some default properties about the line
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';

    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
  }

  private originPos;
  private nextPos: any;
  public oldPos: any;
  public sendOldPos: boolean = false;

  private captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from the canvas element
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e: MouseEvent) => {
          // after a mouse down, we'll record all mouse moves
          this.sendOldPos = true;
          this.oldPos = undefined;
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              
              // we'll stop (and unsubscribe) once the user releases the mouse
              // this will trigger a 'mouseup' event    
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              // pairwise lets us get the previous value to draw a line from
              // the previous point to the current point
              pairwise()
            )
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();
        // previous and current position with the offset

        if (this.sendOldPos) {
          this.oldPos = {
            x: res[0].clientX - rect.left,
            y: res[0].clientY - rect.top
          };
        }

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };
        // strokes the current path with the styles we set earlier
        let newP = { clientX: currentPos.x, clientY: currentPos.y };
        this.emitData(newP);

        // this.oldPos = undefined;
        // this method we'll implement soon to do the actual drawing
        // this.drawOnCanvas(prevPos, currentPos);
      });
  }

  private async emitData(newPoint: any) {
    
    let newPos = { x: newPoint.clientX, y: newPoint.clientY };
    if (this.sendOldPos && this.oldPos) {
      let line = [];
      line.push(this.oldPos);
      line.push(newPos);
      console.log("StrokeStarted: " + JSON.stringify(line));
      this.socketService.draw(line);
      this.sendOldPos = false;
    } else {
      let point = [];
      point.push(newPos);
      this.socketService.draw(point);
    }
  }

  private drawSync(data) {
    var line = data.line;
    this.cx.strokeStyle = '#333333';
    this.cx.beginPath();

    if (line.length === 2) {
      this.originPos = { x: line[0].x, y: line[0].y};
      this.nextPos = { x: line[1].x, y: line[1].y };
    } else {
      this.nextPos = { x: line[0].x, y: line[0].y };
    }
    this.cx.moveTo(this.originPos.x, this.originPos.y);
    this.cx.lineTo(this.nextPos.x, this.nextPos.y);
    this.cx.stroke();
    this.originPos = this.nextPos;
  }
}
