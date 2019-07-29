﻿import { AppTranslationService } from '../../services/app-translation.service';
import { LockPermissionEnum } from '../../models/chain-db.model';

export type DatabaseCreatePageTranslationType = {
    dataActionExceedsMessage?: string,
    schemaActionExceedsMessage?: string,
    lockTargetExceedsMessage?: string,
    lackPrivateKeyTitle?: string,
    lackPrivateKeyContent?: string,
    successSendTitle?: string,
    successSendContent?: string,
    errorSendTitle?: string,
    errorSendContent?: string,
    unknownTxTypeTitle?: string,
    unknownTxTypeContent?: string,
    gotoCodeConfirmation?: string,
    gotoGuiConfirmation?: string,
    exampleOverwrittenConfirmation?: string,
    parseCodeExceptionMessage?: string,
    forbidSubmitInCodeModeMessage?: string,
};

export type PermissionCheckBoxType = {
    value: LockPermissionEnum,
    name: string,
    desc: string,
};

export type DatabaseCreatePagePermissionListType = Array<PermissionCheckBoxType>;

export class DatabaseCreatePageTranslation {
    static getTranslations(translationService: AppTranslationService) {
        let translations: DatabaseCreatePageTranslationType = {};
        let gT = (key: string) => translationService.getTranslation(key);
        translations.dataActionExceedsMessage = gT("db.create.notification.DataActionExceedsMessage");
        translations.schemaActionExceedsMessage = gT("db.create.notification.SchemaActionExceedsMessage");
        translations.lockTargetExceedsMessage = gT("db.create.notification.LockTargetExceedsMessage");
        translations.lackPrivateKeyTitle = gT("db.create.notification.LackPrivateKeyTitle");
        translations.lackPrivateKeyContent = gT("db.create.notification.LackPrivateKeyContent");
        translations.successSendTitle = gT("db.create.notification.SuccessSendTitle");
        translations.successSendContent = gT("db.create.notification.SuccessSendContent");
        translations.errorSendTitle = gT("db.create.notification.ErrorSendTitle");
        translations.errorSendContent = gT("db.create.notification.ErrorSendContent");
        translations.unknownTxTypeTitle = gT("db.create.notification.UnknownTxTypeTitle");
        translations.unknownTxTypeContent = gT("db.create.notification.UnknownTxTypeContent");
        translations.gotoCodeConfirmation = gT("db.create.notification.GotoCodeConfirmation");
        translations.gotoGuiConfirmation = gT("db.create.notification.GotoGuiConfirmation");
        translations.exampleOverwrittenConfirmation = gT("db.create.notification.ExampleOverwrittenConfirmation");
        translations.parseCodeExceptionMessage = gT("db.create.notification.ParseCodeExceptionMessage");
        translations.forbidSubmitInCodeModeMessage = gT("db.create.notification.ForbidSubmitInCodeModeMessage");

        return translations;
    }

    static getPermissionList(translationService: AppTranslationService): DatabaseCreatePagePermissionListType {
        let gT = (key: string) => translationService.getTranslation(key);
        let permissionList: DatabaseCreatePagePermissionListType = [
            { value: "None", name: gT("db.create.lock.permission.None"), desc: gT("db.create.lock.permissionDesc.None") },
            { value: "ReadOnly", name: gT("db.create.lock.permission.ReadOnly"), desc: gT("db.create.lock.permissionDesc.ReadOnly") },
            { value: "Insert", name: gT("db.create.lock.permission.Insert"), desc: gT("db.create.lock.permissionDesc.Insert") },
            { value: "Update", name: gT("db.create.lock.permission.Update"), desc: gT("db.create.lock.permissionDesc.Update") },
            { value: "Delete", name: gT("db.create.lock.permission.Delete"), desc: gT("db.create.lock.permissionDesc.Delete") },
            { value: "AlterLock", name: gT("db.create.lock.permission.AlterLock"), desc: gT("db.create.lock.permissionDesc.AlterLock") },
            { value: "AlterSchema", name: gT("db.create.lock.permission.AlterSchema"), desc: gT("db.create.lock.permissionDesc.AlterSchema") },
        ];

        return permissionList;
    }

    static getActionDefinitions(translationService: AppTranslationService) {
        let gT = (key: string) => translationService.getTranslation(key);
        let baseActionDef = {
            filter: { inputClass: "hidden" },
            attr: { class: "table table-bordered table-reset" },
            edit: {
                editButtonContent: gT("db.create.schema.table.text.EditButtonContent"),
                saveButtonContent: gT("db.create.schema.table.text.SaveButtonContent"),
                cancelButtonContent: gT("db.create.schema.table.text.CancelButtonContent"),
            },
            add: {
                addButtonContent: gT("db.create.schema.table.text.AddButtonContent"),
                createButtonContent: gT("db.create.schema.table.text.CreateButtonContent"),
                cancelButtonContent: gT("db.create.schema.table.text.CancelButtonContent"),
            },
            delete: {
                deleteButtonContent: gT("db.create.schema.table.text.DeleteButtonContent"),
            },
            actions: {
                columnTitle: gT("db.create.schema.table.text.ColumnTitle"),
            },
            noDataMessage: gT("db.create.schema.table.text.NoDataMessage"),
        };
        let updateDropSchemaActionDef = Object.assign({
            columns: {
                name: {
                    title: gT("db.create.schema.table.columns.Name")
                },
            },
        }, baseActionDef);
        let schemaBaseActionDef = Object.assign({
            columns: {
                name: {
                    title: gT("db.create.schema.table.columns.Name")
                },
                type: {
                    title: gT("db.create.schema.table.columns.Type"),
                    editor: {
                        type: 'list', config: {
                            list: [
                                {
                                    value: "string",
                                    title: gT("db.create.schema.table.type.String"),
                                }, {
                                    value: "number",
                                    title: gT("db.create.schema.table.type.Number"),
                                }]
                        }
                    }
                },
                ispk: {
                    title: gT("db.create.schema.table.columns.IsPk"),
                    editor: { type: 'checkbox' }
                },
            },
        }, baseActionDef);
        let updateModifySchemaActionDef = Object.assign({}, schemaBaseActionDef);
        let createSchemaActionDef = Object.assign({}, schemaBaseActionDef);

        return {
            updateDropSchemaActionDef: updateDropSchemaActionDef,
            updateModifySchemaActionDef: updateModifySchemaActionDef,
            createSchemaActionDef: createSchemaActionDef,
        };
    }
}