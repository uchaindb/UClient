import { Injectable, Injector } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigurationService } from './configuration.service';
import { LocalStoreManager } from './local-store-manager.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { InboxNotification, AlarmConfiguration } from '../models/alarm.model';
import { Subject } from 'rxjs';
import { AppTranslationService } from './app-translation.service';

@Injectable()
export class NotificationService {

    public static readonly DBKEY_NOTIFICATION_LIST = "notification_list";

    translations: {
        senderName?: string,
    } = {};

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        private localStoreManager: LocalStoreManager,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.senderName = gT("alarm.service.SenderName");
    }

    getNotificationList(): Observable<Array<InboxNotification>> {
        if (!this.localStoreManager.exists(NotificationService.DBKEY_NOTIFICATION_LIST)) {
            this.localStoreManager.savePermanentData([], NotificationService.DBKEY_NOTIFICATION_LIST);
        }
        var nlist = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST)
            .reverse();
        return Observable.of(nlist);
    }

    getNotification(id: string, setRead = false): Observable<InboxNotification> {
        if (setRead) this.markRead(id);

        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var n = nlist.find(_ => _.id == id);
        return Observable.of(n);
    }

    createNotification(summary: string, origin: AlarmConfiguration = null, sender: string = null): void {
        sender = sender || this.translations.senderName;
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var id = '_' + Math.random().toString(36).substr(2, 9);
        nlist.push({ id: id, sender: sender, summary: summary, origin: origin })
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
        this.updateNewNotificationIdentity();
    }

    markRead(id: string, read = true): void {
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var idx = nlist.findIndex(_ => _.id == id);
        nlist[idx].read = read;
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
        this.updateNewNotificationIdentity();
    }

    removeNotification(id: string): void {
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var idx = nlist.findIndex(_ => _.id == id);
        nlist.splice(idx, 1);
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
        this.updateNewNotificationIdentity();
    }

    private subjectNewNotificationIdentity = new Subject<boolean>();

    private updateNewNotificationIdentity() {
        this.subjectNewNotificationIdentity.next(this.getNewNotificationIdentityInternal());
    }

    private getNewNotificationIdentityInternal(): boolean {
        var nlist = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) as Array<InboxNotification>;
        if (nlist.filter(_ => !_.read).length > 0) {
            return true;
        } else {
            return false;
        }
    }

    getNewNotificationIdentity(): Observable<boolean> {
        return Observable.of(this.getNewNotificationIdentityInternal())
            .merge(Observable.from(this.subjectNewNotificationIdentity));
    }
}
