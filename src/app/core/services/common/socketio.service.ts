import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  public socket;

  constructor() { }
  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT);
  }

  draw(message: any) {
    this.socket.emit('draw', message);
  }
}
