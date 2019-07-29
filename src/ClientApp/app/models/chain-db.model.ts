﻿export class ChainDb {
    constructor(obj: ChainDb = {} as ChainDb) {
        let {
            id = null,
            name = null,
            description = null,
            image = null,
            address = null,
            staffpick = 0,
            editmode = false,
        } = obj;

        this.id = id;
        this.name = name;
        this.description = description;
        this.image = image;
        this.address = address;
        this.staffpick = staffpick;
        this.editmode = editmode;
    }

    public id: string;
    public name: string;
    public description?: string;
    public image?: string;
    public address: string;
    public staffpick?: number;// 0: not pick; 1~255: greater number is priority pick
    public editmode?: boolean;

}

export class ChainDbDetail {
    constructor(obj: ChainDbDetail = {} as ChainDbDetail) {
        let {
            id = null,
            height = -1,
            lastBlock = null,
            image = null,
            address = null,
        } = obj;

        this.id = id;
        this.height = height;
        this.lastBlock = lastBlock;
        this.image = image;
        this.address = address;
    }

    public id: string;
    public height: number;
    public lastBlock: Block;
    public image?: string;
    public address: string;

}

export class HashBase {
    constructor(obj: HashBase = {} as HashBase) {
        let {
            Hash = null,
        } = obj;

        this.Hash = Hash;
    }

    public Hash: string;
}
export class Block extends HashBase {
    constructor(obj: Block = {} as Block) {
        let {
            Hash = null,
            PreviousBlockHash = null,
            Version = -1,
            Height = -1,
            Time = null,
            BookKeeper = null,
            Signature = null,
            Txs = [],
        } = obj;
        super({ Hash: Hash });

        this.PreviousBlockHash = PreviousBlockHash;
        this.Version = Version;
        this.Height = Height;
        this.Time = Time;
        this.BookKeeper = BookKeeper;
        this.Signature = Signature;
        this.Txs = Txs;
    }

    public PreviousBlockHash: string;
    public Version: number;
    public Height: number;
    public Time: string;
    public BookKeeper: string;
    public Signature: string;
    public Txs: Array<Tx>;

}

export type TxTypeEnum = "SchemaTx" | "DataTx" | "LockTx";

export class Tx extends HashBase {
    constructor(obj: Tx = {} as Tx) {
        let {
            Hash = null,
            Initiator = null,
            Type = null,
            Signature = null,
            Actions = [],
            LockTargets = [],
            LockScripts = [],
            WitnessBlock = null,
            Block = null,
        } = obj;
        super({ Hash: Hash });

        this.Initiator = Initiator;
        this.Type = Type;
        this.Signature = Signature;
        this.Actions = Actions;
        this.LockTargets = LockTargets;
        this.LockScripts = LockScripts;
        this.WitnessBlock = WitnessBlock;
        this.Block = Block;
    }

    public Initiator?: string;
    public Type?: TxTypeEnum;
    public Signature?: string;
    public Actions?: Array<DataAction & SchemaAction>;
    public LockTargets?: Array<LockTarget>;
    public LockScripts?: Array<ScriptToken>;
    public WitnessBlock?: string;
    public Block?: string;
}

export type ScriptToken = { OpCode: string, Object: string };

export class HistoryEntry {
    constructor(obj: HistoryEntry = {} as HistoryEntry) {
        let {
            TxHash = null,
            HistoryLength = -1,
        } = obj;

        this.TxHash = TxHash;
        this.HistoryLength = HistoryLength;
    }

    public TxHash: string;
    public HistoryLength: number;

}

export type CellDef = { name: string, pkval: string, data: string, tran?: string, history: number };
export type ColumnDef = { name: string, tran?: string, history?: number };
export type RowDef = Array<CellDef>;
export type TableData = { rows: Array<RowDef>, columns: Array<ColumnDef>, pkname: string, tableName: string, dbid: string }
export type QueryTableResponse = { data: TableData, cursorId: number, }
export type QueryCellResponse = { data: TableData, txs: Array<Tx> }

export type DataActionEnum = "InsertDataAction" | "UpdateDataAction" | "DeleteDataAction";
export type ColumnData = { Name: string, Data: string }
export type DataAction = {
    Type: DataActionEnum,
    PrimaryKeyValue?: string,
    SchemaName: string,
    Columns?: Array<ColumnData>,
}

export type SchemaColumnType = "String" | "Number" | "Blob";
export type SchemaActionEnum = "CreateSchemaAction" | "ModifySchemaAction" | "DropSchemaAction";
export type SchemaColumnDefinition = { Name: string, Type: SchemaColumnType, PrimaryKey: boolean }
export type SchemaAction = {
    Type: SchemaActionEnum,
    Name: string,
    Columns?: Array<SchemaColumnDefinition>,
    AddOrModifyColumns?: Array<SchemaColumnDefinition>,
    DropColumns?: Array<string>,
}

export type LockTargetEnum = "None" | "Database" | "TableSchema" | "TableRowData" | "TableCellData" | "TableColumnData";
export type LockPermissionEnum = "None" | "ReadOnly" | "Insert" | "Update" | "Delete" | "AlterSchema" | "AlterLock";
export type LockTarget = {
    TargetType: LockTargetEnum,
    PublicPermission: LockPermissionEnum[];
    TableName?: string,
    PrimaryKey?: string,
    ColumnName?: string,
}

export type ChainDbRpcMethod =
    "Status" |
    "CreateSchemaTx" |
    "CreateDataTx" |
    "CreateLockTx" |
    "QueryData" |
    "QueryChain" |
    "QueryCell" |
    "ListTables"
    ;

export type UInt256 = string;
export class RpcRequest { }
export class RpcResponse { }

export interface CreateDataTxRpcRequest extends RpcRequest {
    // TODO: should be strong typed
    Initiator?: string;
    Signature?: string;
    WitnessBlock?: string;
    Actions?: DataAction[];
}

export interface CreateSchemaTxRpcRequest extends RpcRequest {
    // TODO: should be strong typed
    Initiator?: string;
    Signature?: string;
    WitnessBlock?: string;
    Actions?: SchemaAction[];
}

export interface ConnectRpcResponse extends RpcResponse {
    NodeId: string;
}
export interface StatusRpcResponse extends RpcResponse {
    Height: number;
    Tail: Block;
}

export interface BlocksRpcRequest extends RpcRequest {
    // TODO: should be strong typed
    BlockLocatorHashes: string[];
}

export interface BlocksRpcResponse extends RpcResponse {
    Blocks: Block[];
}

//export interface StatesRpcResponse extends RpcResponse {
//    States: State[];
//}

//export interface ListContractRpcResponse extends RpcResponse {
//    // TODO: should be strong typed
//    Contracts: string[];
//}

//export interface VerifyContractRpcRequest extends RpcRequest {
//    ContractCode: string;
//    }

//export interface VerifyContractRpcResponse extends RpcResponse {
//    Schema: JsonSchema;
//}

//export interface CreateContractRpcRequest extends RpcRequest {
//    ContractCode: string;
//    // TODO: should be strong typed
//    Initiator: string;
//    Signature: string;
//    Parameters: string[];
//    }

//export interface CreateContractRpcResponse extends RpcResponse {
//    ContractId: UInt256;
//}

//export interface CreateTxRpcRequest extends RpcRequest {
//    ContractId: UInt256;
//    Method: string;
//    // TODO: should be strong typed
//    Initiator: string;
//    Signature: string;
//    Parameters: string[];

//    }

export interface CreateTxRpcResponse extends RpcResponse {
    TxId: UInt256;
}

//export interface GetTxSchemaRpcResponse extends RpcResponse {
//    Schemas: JsonSchema[];
//}

//export interface GetTxSchemaRpcRequest extends RpcRequest {
//    ContractId: UInt256;
//    }

export interface QueryDataRpcRequest extends RpcRequest {
    TableName: string;
    Start: number;
    Count: number;
    //Headers: string[];
    //Query: string[];

}

export interface QueryDataRpcResponse extends RpcResponse {
    PrimaryKeyName: string;
    Headers: string[];
    Data: string[];
    HeaderHistories: HistoryEntry[];
    DataHistories: number[];
    CursorId: number;
}

export interface HistoryEntry {
    TxHash: UInt256;
    HistoryLength: number;
}

export interface QueryDataResponseRow {
    Cells: string[];
}

export interface ListTablesRpcResponse extends RpcResponse {
    Tables: ListTableSchema[];
}

export interface ListTableSchema {
    Name: string;
    Headers: string[];
    History: HistoryEntry;
    RecordCount: number;
}

export interface QueryChainRpcRequest extends RpcRequest {
    Hash: string;
    Height: number | null;
}

export interface QueryChainRpcResponse extends RpcResponse {
    Block?: Block;
    Tx?: Tx;
}

export interface QueryCellRpcRequest extends RpcRequest {
    TableName: string;
    PrimaryKeyValue: string;
    ColumnName: string;
    Columns: string[];
}

export interface QueryCellRpcResponse extends RpcResponse {
    Txs: UInt256[];

    PrimaryKeyName: string;
    Headers: string[];
    Row: string[];
    RowHistories: HistoryEntry[];
}