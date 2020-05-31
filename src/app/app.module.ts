import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WhiteboardCanvasComponent } from './core/common/whiteboard-canvas/whiteboard-canvas.component';
import { SocketioService } from './core/services/common/socketio.service';

@NgModule({
  declarations: [
    AppComponent,
    WhiteboardCanvasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [SocketioService],
  bootstrap: [AppComponent]
})
export class AppModule { }
