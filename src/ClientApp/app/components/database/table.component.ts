import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { ChainDb, HistoryEntry, ColumnDef, CellDef, TableData } from '../../models/chain-db.model';
import { AlertType, AlertConfiguration } from '../../models/alert.model';

@Component({
    selector: 'database-table',
    templateUrl: './table.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseTableComponent implements OnInit {

    _table: TableData;
    get table(): TableData { return this._table; }
    @Input() set table(value: TableData) {
        if (!value) return;
        this._table = value;
        this.refreshAlerts();
    }

    @Input() highlightColumn: string;

    monitorColumn: { [idx: string]: boolean };
    monitorCell: { [idx: string]: boolean };

    alertColumnData: AlertType = "column-data-modify";
    alertCellData: AlertType = "cell-data-modify";
    alertConfigs: Array<AlertConfiguration>;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit() { }

    refreshAlerts() {
        this.dataService.getAlertConfigList(this.table.dbid)
            .subscribe(_ => {
                this.alertConfigs = _
                    .filter(_ => _.dbid == this.table.dbid && _.tableName == this.table.tableName);
                this.monitorColumn = this.alertConfigs.filter(_ => _.type == this.alertColumnData)
                    .reduce((obj, item) => { obj[item.columnName] = true; return obj; }, {});
                this.monitorCell = this.alertConfigs.filter(_ => _.type == this.alertCellData)
                    .reduce((obj, item) => { obj[item.columnName + '-|-' + item.primaryKeyValue] = true; return obj; }, {});

                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alertConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor(type: AlertType, colName: string, pkval: string = null) {
        let config = this.alertConfigs
            .find(_ => _.type == type
                && _.dbid == this.table.dbid
                && _.tableName == this.table.tableName
                && _.columnName == colName
                && _.primaryKeyValue == pkval
            );
        if (config) {
            this.dataService.removeAlertConfig(config);
            this.alertService.showMessage('alert removed', '', MessageSeverity.success);
        } else {
            this.dataService.addAlertConfig({
                type: type,
                dbid: this.table.dbid,
                tableName: this.table.tableName,
                columnName: colName,
                primaryKeyValue: pkval,
            })
            this.alertService.showMessage('alert added', '', MessageSeverity.success);
        }

        this.refreshAlerts();
    }


}
