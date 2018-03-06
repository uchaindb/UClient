import { Directive, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';

// credited to: https://stackoverflow.com/a/49006667
@Directive({
    selector: '[routeTransformer]'
})
export class RouteTransformerDirective {

    constructor(private el: ElementRef, private router: Router) { }

    @HostListener('click', ['$event'])
    public onClick(event) {
        if (event.target.tagName === 'A') {
            this.router.navigate([event.target.getAttribute('href')]);
            event.preventDefault();
        } else {
            return;
        }
    }

};