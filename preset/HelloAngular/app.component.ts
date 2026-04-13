import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `<h1>Angular 最简配置</h1><p>你好 Angular!</p>`,
  styles: ['h1 { color: #333; } p { color: #666; }']
})
export class AppComponent { }
