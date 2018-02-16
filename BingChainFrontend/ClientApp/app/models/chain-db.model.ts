export class ChainDb {
    constructor(obj: ChainDb = {} as ChainDb) {
        let {
            id = null,
            name = null,
            description = null,
            image = null,
            address = null,
        } = obj;

        this.id = id;
        this.name = name;
        this.description = description;
        this.image = image;
        this.address = address;
    }

    public id: string;
    public name: string;
    public description?: string;
    public image?: string;
    public address: string;

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
            Transactions = [],
        } = obj;
        super({ Hash: Hash });

        this.PreviousBlockHash = PreviousBlockHash;
        this.Version = Version;
        this.Height = Height;
        this.Time = Time;
        this.BookKeeper = BookKeeper;
        this.Signature = Signature;
        this.Transactions = Transactions;
    }

    public PreviousBlockHash: string;
    public Version: number;
    public Height: number;
    public Time: string;
    public BookKeeper: string;
    public Signature: string;
    public Transactions: Array<Transaction>;

}

export type TransactionTypeEnum = "SchemaTransaction" | "DataTransaction" | "LockTransaction";

export class Transaction extends HashBase {
    constructor(obj: Transaction = {} as Transaction) {
        let {
            Hash = null,
            Initiator = null,
            Type = null,
            Signature = null,
            Actions = [],
        } = obj;
        super({ Hash: Hash });

        this.Initiator = Initiator;
        this.Type = Type;
        this.Signature = Signature;
        this.Actions = Actions;
    }

    public Initiator?: string;
    public Type?: TransactionTypeEnum;
    public Signature?: string;
    public Actions?: Array<any>;

}

export class HistoryEntry {
    constructor(obj: HistoryEntry = {} as HistoryEntry) {
        let {
            TransactionHash = null,
            HistoryLength = -1,
        } = obj;

        this.TransactionHash = TransactionHash;
        this.HistoryLength = HistoryLength;
    }

    public TransactionHash: string;
    public HistoryLength: number;

}

export type CellDef = { name: string, pkval: string, data: string, tran: string, history: number };
export type ColumnDef = { name: string, tran: string, history: number };
export type RowDef = Array<CellDef>;
export type TableData = { rows: Array<RowDef>, columns: Array<ColumnDef>, pkname: string, tableName: string, dbid: string }
export type QueryTableResponse = { data: TableData }
export type QueryCellResponse = { data: TableData, transactions: Array<Transaction> }

export type DataActionEnum = "InsertDataAction" | "UpdateDataAction" | "DeleteDataAction";
export type ColumnData = { Name: string, Data: string }
export type DataAction = {
    Type: DataActionEnum,
    PrimaryKeyValue?: string,
    SchemaName: string,
    Columns?: Array<ColumnData>,
}

export enum SchemaColumnType {
    String,
    Number,
    Blob,
}
export type SchemaActionEnum = "CreateSchemaAction" | "ModifySchemaAction" | "DropSchemaAction";
export type SchemaColumnDefinition = { Name: string, Type: SchemaColumnType, PrimaryKey: boolean }
export type SchemaAction = {
    Type: SchemaActionEnum,
    Name: string,
    Columns?: Array<SchemaColumnDefinition>,
    AddOrModifyColumns?: Array<SchemaColumnDefinition>,
    DropColumns?: Array<string>,
}
