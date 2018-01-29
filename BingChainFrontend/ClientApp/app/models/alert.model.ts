export type AlertType = "chain-fork" | "table-schema" | "table-data-modify" | "column-data-modify" | "cell-data-modify";
export type AlertConfiguration = {
    type: AlertType,
    dbid: string,
    tableName?: string,
    columnName?: string,
    primaryKeyValue?: string,
    //lastTransaction?: string,
};
