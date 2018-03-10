import { ChainDb, Block, SchemaAction, DataAction, SchemaColumnDefinition, SchemaActionEnum, DataActionEnum, ColumnData, LockTarget, LockTargetEnum, SchemaColumnType, LockPermissionEnum } from '../../models/chain-db.model';
import { SchemaActionCreationType, SchemaActionCreationTypeEnum, DataActionCreationType, DataActionCreationTypeEnum, DataActionColumnCreationType, LockTargetCreationType, LockTargetCreationTypeEnum } from './create.page';
import { LocalDataSource } from 'ng2-smart-table';

export class DatabaseCreatePageFunction {

    static getSchemaActions(arr: Array<SchemaActionCreationType>): Array<SchemaAction> {
        let getSchemaType = (type: SchemaActionCreationTypeEnum): SchemaActionEnum =>
            type == "create" ? "CreateSchemaAction"
                : type == "modify" ? "ModifySchemaAction"
                    : "DropSchemaAction";

        let getColumnDefType = (type: string): SchemaColumnType =>
            type == "string" ? "String"
                : type == "number" ? "Number"
                    : "Blob";

        let mapSchemaColumnDefinition = (arr): Array<SchemaColumnDefinition> => {
            if (!arr || arr.length == 0) return null;
            let ret = arr.map(c => (<SchemaColumnDefinition>{ Type: getColumnDefType(c.type), Name: c.name, PrimaryKey: c.ispk == true }));
            return ret;
        };

        let mapStringArray = (arr): Array<string> => {
            if (!arr) return null;
            let ret = arr.map(c => c.name);
            if (ret.length == 0) return null;
            return ret;
        };
        // TODO: maybe need to avoid using protected property `data`?
        var sa = arr
            .map<SchemaAction>(_ => ({
                Type: getSchemaType(_.type),
                Name: _.tableName,
                Columns: mapSchemaColumnDefinition(_.columns && (<any>_.columns).data),
                AddOrModifyColumns: mapSchemaColumnDefinition(_.modifyColumns && (<any>_.modifyColumns).data),
                DropColumns: mapStringArray(_.dropColumns && (<any>_.dropColumns).data),
            }));

        return sa;
    }

    static getSchemaActionCreationTypes(actions: Array<SchemaAction>): Array<SchemaActionCreationType> {
        let getSchemaType = (type: SchemaActionEnum): SchemaActionCreationTypeEnum =>
            type == "CreateSchemaAction" ? "create"
                : type == "ModifySchemaAction" ? "modify"
                    : "drop";

        let getColumnDefType = (type: SchemaColumnType): string =>
            type == "String" ? "string"
                : type == "Number" ? "number"
                    : "blob";

        let mapSchemaColumnDefinition = (arr: Array<SchemaColumnDefinition>): any => {
            if (!arr || arr.length == 0) return [];
            let ret = arr.map(c => ({ type: getColumnDefType(c.Type), name: c.Name, ispk: c.PrimaryKey == true }));
            return ret;
        };

        let mapStringArray = (arr: Array<string>): any => !arr ? [] : arr.map(_ => ({ name: _ }));

        return actions
            .map<SchemaActionCreationType>(_ => ({
                type: getSchemaType(_.Type),
                tableName: _.Name,
                columns: new LocalDataSource(mapSchemaColumnDefinition(_.Columns)),
                modifyColumns: new LocalDataSource(mapSchemaColumnDefinition(_.AddOrModifyColumns)),
                dropColumns: new LocalDataSource(mapStringArray(_.DropColumns)),
            }));
    }

    static getDataActions(arr: Array<DataActionCreationType>): Array<DataAction> {
        let getDataType = (type: DataActionCreationTypeEnum): DataActionEnum =>
            type == "insert" ? "InsertDataAction"
                : type == "update" ? "UpdateDataAction"
                    : "DeleteDataAction";

        let mapColumnData = (obj): Array<ColumnData> => {
            if (!obj) return null;
            let ret = Object.keys(obj).map(_ => (<ColumnData>{ Name: _, Data: obj[_] }));
            if (ret.length == 0) return null;
            return ret;
        };

        var da = arr
            .map<DataAction>(_ => ({
                Type: getDataType(_.type),
                SchemaName: _.tableName,
                Columns: mapColumnData(_.columns),
                PrimaryKeyValue: _.pkval,
            }));

        return da;
    }

    static getDataActionCreationTypes(actions: Array<DataAction>): Array<DataActionCreationType> {
        let getDataType = (type: DataActionEnum): DataActionCreationTypeEnum =>
            type == "InsertDataAction" ? "insert"
                : type == "UpdateDataAction" ? "update"
                    : "delete";

        let mapColumnData = (arr: Array<ColumnData>): DataActionColumnCreationType => {
            let obj = {};
            if (!arr || arr.length == 0) return obj;
            for (var i = 0; i < arr.length; i++) {
                obj[arr[i].Name] = arr[i].Data;
            }
            return obj;
        };

        return actions
            .map<DataActionCreationType>(_ => ({
                type: getDataType(_.Type),
                tableName: _.SchemaName,
                columns: mapColumnData(_.Columns),
                pkval: _.PrimaryKeyValue,
            }));
    }

    static getLockTargets(arr: Array<LockTargetCreationType>): Array<LockTarget> {
        let getDataType = (type: LockTargetCreationTypeEnum): LockTargetEnum =>
            type == "database" ? "Database"
                : type == "schema" ? "TableSchema"
                    : type == "row" ? "TableRowData"
                        : type == "column" ? "TableColumnData"
                            : type == "cell" ? "TableCellData"
                                : "None";

        let mapColumnData = (obj): Array<ColumnData> => {
            if (!obj) return null;
            let ret = Object.keys(obj).map(_ => (<ColumnData>{ Name: _, Data: obj[_] }));
            if (ret.length == 0) return null;
            return ret;
        };

        var lt = arr
            .map<LockTarget>(_ => ({
                TargetType: getDataType(_.type),
                PublicPermission: _.permissions,
                TableName: _.tableName,
                PrimaryKey: _.pkval,
                ColumnName: _.col,
            }));

        return lt;
    }

    static getLockTargetCreationTypes(targets: Array<LockTarget>): Array<LockTargetCreationType> {
        let getDataType = (type: LockTargetEnum): LockTargetCreationTypeEnum =>
            type == "Database" ? "database"
                : type == "TableSchema" ? "schema"
                    : type == "TableRowData" ? "row"
                        : type == "TableColumnData" ? "column"
                            : type == "TableCellData" ? "cell"
                                : "none";

        let mapColumnData = (obj): Array<ColumnData> => {
            if (!obj) return null;
            let ret = Object.keys(obj).map(_ => (<ColumnData>{ Name: _, Data: obj[_] }));
            if (ret.length == 0) return null;
            return ret;
        };

        return targets
            .map<LockTargetCreationType>(_ => ({
                type: getDataType(_.TargetType),
                permissions: _.PublicPermission,
                tableName: _.TableName,
                pkval: _.PrimaryKey,
                col: _.ColumnName,
            }));
    }
}