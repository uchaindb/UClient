export type AlarmType = "chain-fork" | "table-schema" | "table-data-modify" | "column-data-modify" | "cell-data-modify";
export type AlarmData = {
    lastBlockId?: string,
    lastBlockHeight?: number,
    lastTxId?: string,
}
export type AlarmConfiguration = {
    type: AlarmType,
    dbid: string,
    tableName?: string,
    columnName?: string,
    primaryKeyValue?: string,
    data?: AlarmData,
};

export type InboxNotification = {
    id: string,
    sender: string,
    summary?: string,
    read?: boolean,
    origin?: AlarmConfiguration,
};
