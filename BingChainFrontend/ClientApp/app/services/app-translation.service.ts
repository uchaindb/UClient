import { Injectable } from '@angular/core';
import { TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';

@Injectable()
export class AppTranslationService {
    private _languageChanged = new Subject<string>();
    readonly defaultLanguage = "zh";
    loadingMessage: LoadingMessage;
    imageErrorMessage: ImageErrorMessage;

    constructor(private translate: TranslateService) {
        this.setDefaultLanguage(this.defaultLanguage);

        this.loadingMessage = new LoadingMessage(this);
        this.imageErrorMessage = new ImageErrorMessage(this);
    }

    addLanguages(lang: string[]) {
        this.translate.addLangs(lang);
    }

    setDefaultLanguage(lang: string) {
        this.translate.setDefaultLang(lang);
    }

    getDefaultLanguage() {
        return this.translate.defaultLang;
    }

    getBrowserLanguage() {
        return this.translate.getBrowserLang();
    }

    useBrowserLanguage(): string | void {
        let browserLang = this.getBrowserLanguage();

        if (browserLang.match(/zh/)) {
            this.changeLanguage(browserLang);
            return browserLang;
        }
    }

    changeLanguage(language: string = "zh") {
        if (!language)
            language = this.translate.defaultLang;

        if (language != this.translate.currentLang) {
            setTimeout(() => {
                this.translate.use(language);
                this._languageChanged.next(language);
            });
        }

        return language;
    }

    getTranslation(key: string | Array<string>, interpolateParams?: Object): string | any {
        return this.translate.instant(key, interpolateParams);
    }

    getTranslationAsync(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
        return this.translate.get(key, interpolateParams);
    }

    languageChangedEvent() {
        return this._languageChanged.asObservable();
    }
}

export class TranslateLanguageLoader implements TranslateLoader {
    /**
     * Gets the translations from webpack
     * @param lang
     * @returns {any}
     */
    public getTranslation(lang: string): any {
        //Note Dynamic require(variable) will not work. Require is always at compile time

        switch (lang) {
            case "zh":
                return Observable.of(require("../../assets/locale/zh.json"));
            default:
        }
    }
}

export class ImageErrorMessage {
    constructor(
        private translationService: AppTranslationService,
        obj: ImageErrorMessage = {} as ImageErrorMessage) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        let {
            NoFile = gT("defaults.imageError.NoFile"),
            EmptyFile = gT("defaults.imageError.EmptyFile"),
            InvalidExtension = gT("defaults.imageError.InvalidExtension"),
            SizeTooLarge = gT("defaults.imageError.SizeTooLarge"),
            SizeTooSmall = gT("defaults.imageError.SizeTooSmall"),
        } = obj;

        this.NoFile = NoFile;
        this.EmptyFile = EmptyFile;
        this.InvalidExtension = InvalidExtension;
        this.SizeTooLarge = SizeTooLarge;
        this.SizeTooSmall = SizeTooSmall;
    }

    public NoFile: string;
    public EmptyFile: string;
    public InvalidExtension: string;
    public SizeTooLarge: string;
    public SizeTooSmall: string;
}

export class LoadingMessage {
    constructor(
        private translationService: AppTranslationService,
        obj: LoadingMessage = {} as LoadingMessage) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        let {
            submit = gT("defaults.loading.Submit"),
            load = gT("defaults.loading.Load"),
            upload = gT("defaults.loading.Upload"),
            remove = gT("defaults.loading.Remove"),
        } = obj;

        this.submit = submit;
        this.load = load;
        this.upload = upload;
        this.remove = remove;
    }

    public submit: string;
    public load: string;
    public upload: string;
    public remove: string;
}
