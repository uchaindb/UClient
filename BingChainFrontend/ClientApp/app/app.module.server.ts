//import { NgModule } from '@angular/core';
//import { ServerModule } from '@angular/platform-server';
import { AppModuleShared } from './app.module.shared';
import { AppComponent } from './components/app/app.component';

// to fix prerender module error with: document is not defined
// which caused by `import {BrowserAnimationsModule} from '@angular/platform-browser/animations';`
// credit to https://github.com/angular/angular/issues/15098#issuecomment-308863439
// imports
import { NgModule, NgModuleFactory, NgModuleFactoryLoader, RendererFactory2, NgZone } from '@angular/core';
import { ServerModule, ɵServerRendererFactory2 } from '@angular/platform-server';
import { ɵAnimationEngine } from '@angular/animations/browser';
import { NoopAnimationsModule, ɵAnimationRendererFactory } from '@angular/platform-browser/animations';

// declarations
export function instantiateServerRendererFactory(
    renderer: RendererFactory2, engine: ɵAnimationEngine, zone: NgZone) {
    return new ɵAnimationRendererFactory(renderer, engine, zone);
}

const createRenderer = ɵServerRendererFactory2.prototype.createRenderer;
ɵServerRendererFactory2.prototype.createRenderer = function () {
    const result = createRenderer.apply(this, arguments);
    const setProperty = result.setProperty;
    result.setProperty = function () {
        try {
            setProperty.apply(this, arguments);
        } catch (e) {
            if (e.message.indexOf('Found the synthetic') === -1) {
                throw e;
            }
        }
    };
    return result;
}

export const SERVER_RENDER_PROVIDERS = [
    {
        provide: RendererFactory2,
        useFactory: instantiateServerRendererFactory,
        deps: [ɵServerRendererFactory2, ɵAnimationEngine, NgZone]
    }
];

@NgModule({
    bootstrap: [ AppComponent ],
    imports: [
        ServerModule,
        AppModuleShared,
        NoopAnimationsModule,
    ],
    providers: [
        SERVER_RENDER_PROVIDERS
    ],
})
export class AppModule {
}

// following is for fixing server side rendering error: sessionStorage not defined
// indeed this is not a good solution for angular (ref: https://stackoverflow.com/a/39097958/2558077)
// but this is less source code intrusive

//Stub for localStorage
(global as any).localStorage = {
    getItem: function (key) {
        return this[key];
    },
    setItem: function (key, value) {
        this[key] = value;
    }
};

//Stub for sessionStorage
(global as any).sessionStorage = {
    getItem: function (key) {
        return this[key];
    },
    setItem: function (key, value) {
        this[key] = value;
    }
};