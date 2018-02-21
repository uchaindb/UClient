export type AlertType = "chain-fork" | "table-schema" | "table-data-modify" | "column-data-modify" | "cell-data-modify";
export type AlertData = {
    lastBlockId?: string,
    lastBlockHeight?: number,
    lastTransactionId?: string,
}
export type AlertConfiguration = {
    type: AlertType,
    dbid: string,
    tableName?: string,
    columnName?: string,
    primaryKeyValue?: string,
    data?: AlertData,
};

export type InboxNotification = {
    id: string,
    sender: string,
    summary?: string,
    read?: boolean,
    origin?: AlertConfiguration,
};
