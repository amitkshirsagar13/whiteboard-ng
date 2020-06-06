import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { fromEvent, interval } from 'rxjs';
import { switchMap, takeUntil, pairwise, bufferTime, debounceTime, sampleTime, tap } from 'rxjs/operators';
import { SocketioService } from '../../services/common/socketio.service';
import { Line } from '../../models/draw/line';
import { Point } from '../../models/draw/point';
import { Style } from '../../models/draw/style';

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
    this.style = new Style('#000000');
    this.style.lineWidth = 3;
  }

  @ViewChild('canvas') public canvas: ElementRef;

  // setting a width and height for the canvas
  @Input() public width = 400;
  @Input() public height = 400;
  private cx: CanvasRenderingContext2D;

  private style: Style;

  public ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.width;
    canvasEl.height = this.height;
    // set some default properties about the line
    this.cx.lineCap = 'round';
    this.cx.lineWidth = this.style.lineWidth;
    this.cx.strokeStyle = this.style.strokeStyle;

    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
  }

  private originPos;
  private nextPos: any;
  public oldPos: any;
  public sendOldPos: boolean = false;
  private sampleTime: number = 80;

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
              sampleTime(this.getSampleTime()),
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

        // let speed = this.getDistance(res, rect);


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

  sendStyle: boolean = false;
  private async emitData(newPoint: any) {
    let newPos = { x: newPoint.clientX, y: newPoint.clientY };
    let ln: Line = new Line();
    if (this.sendOldPos && this.oldPos) {
      ln.to = new Point(newPos);
      ln.from = new Point(this.oldPos);
      console.log("StrokeStarted: " + JSON.stringify(ln));
    } else {
      ln.to = new Point(newPos);
    }
    if (this.sendStyle) {
      ln.style = new Style('#00FF00');
      ln.style.strokeStyle = this.style.strokeStyle;
      if (this.style.lineWidth) {
        ln.style.lineWidth = this.style.lineWidth;
      }
    }
    this.socketService.draw(ln);
    this.sendOldPos = false;
    this.sendStyle = false;
  }

  private drawSync(data) {
    let line: Line = data.line;
    this.cx.beginPath();
    if (line.from) {
      this.originPos = line.from;
    }
    if (line.to) {
      this.nextPos = line.to;
    }
    if (line.style) {
      this.cx.strokeStyle = line.style.strokeStyle;
      this.cx.lineWidth = line.style.lineWidth;
    }


    this.cx.moveTo(this.originPos.x, this.originPos.y);
    this.cx.lineTo(this.nextPos.x, this.nextPos.y);
    this.cx.stroke();
    this.originPos = this.nextPos;
  }

  getDistance(res, rect) {
    let a = {
      x: res[0].clientX - rect.left,
      y: res[0].clientY - rect.top
    };
    let b = {
      x: res[1].clientX - rect.left,
      y: res[1].clientY - rect.top
    };
    let distance = Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    );
    if (distance < 20) {
      this.sampleTime = 100;
    } else if (20 < distance && distance < 50) {
      this.sampleTime = 75;
    } else if (50 < distance && distance < 100) {
      this.sampleTime = 50;
    } else {
      this.sampleTime = 40;
    }
    return distance;
  }

  getSampleTime() {
    return this.sampleTime;
  }

  chooseColor(color) {
    this.sendStyle = true;
    this.style.strokeStyle = color;
    console.log(this.style.strokeStyle);
  }

  choosePensil(lineWidth) {
    this.sendStyle = true;
    this.style.lineWidth = lineWidth;
    console.log(this.style.strokeStyle);
  }
}
