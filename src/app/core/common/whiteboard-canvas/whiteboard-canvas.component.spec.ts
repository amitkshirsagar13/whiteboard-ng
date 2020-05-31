import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhiteboardCanvasComponent } from './whiteboard-canvas.component';

describe('WhiteboardCanvasComponent', () => {
  let component: WhiteboardCanvasComponent;
  let fixture: ComponentFixture<WhiteboardCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhiteboardCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhiteboardCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
