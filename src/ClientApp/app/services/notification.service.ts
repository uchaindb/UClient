import { Injectable, Injector } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigurationService } from './configuration.service';
import { LocalStoreManager } from './local-store-manager.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { InboxNotification, AlertConfiguration } from '../models/alert.model';

@Injectable()
export class NotificationService {

    public static readonly DBKEY_NOTIFICATION_LIST = "notification_list";

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        private localStoreManager: LocalStoreManager,
    ) {
    }

    getNotificationList(): Observable<Array<InboxNotification>> {
        if (!this.localStoreManager.exists(NotificationService.DBKEY_NOTIFICATION_LIST)) {
            this.localStoreManager.savePermanentData([], NotificationService.DBKEY_NOTIFICATION_LIST);
        }
        var nlist = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST);
        return Observable.of(nlist);
    }

    getNotification(id: string, setRead = false): Observable<InboxNotification> {
        if (setRead) this.markRead(id);

        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var n = nlist.find(_ => _.id == id);
        return Observable.of(n);
    }

    createNotification(summary: string, origin: AlertConfiguration = null, sender: string = null): void {
        sender = sender || "系统消息";
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var id = '_' + Math.random().toString(36).substr(2, 9);
        nlist.push({ id: id, sender: sender, summary: summary, origin: origin })
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
    }

    markRead(id: string, read = true): void {
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var idx = nlist.findIndex(_ => _.id == id);
        nlist[idx].read = read;
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
    }

    removeNotification(id: string): void {
        var nlist: Array<InboxNotification> = this.localStoreManager.getData(NotificationService.DBKEY_NOTIFICATION_LIST) || [];
        var idx = nlist.findIndex(_ => _.id == id);
        nlist.splice(idx, 1);
        this.localStoreManager.savePermanentData(nlist, NotificationService.DBKEY_NOTIFICATION_LIST);
    }

}
