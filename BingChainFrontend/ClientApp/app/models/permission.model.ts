
export type PermissionNames =
    "Basic Permission" | "Real name Permission" | "Volunteer Permission"
    ;

export type PermissionValues =
    "loggedIn.basic" | "loggedIn.realName" | "volunteer.basic"
    ;

export class Permission {

    public static readonly loggedInBasicPermission: PermissionValues = "loggedIn.basic";
    public static readonly loggedInRealNamePermission: PermissionValues = "loggedIn.realName";
    public static readonly volunteerBasicPermission: PermissionValues = "volunteer.basic";

    constructor(name?: PermissionNames, value?: PermissionValues, groupName?: string, description?: string) {
        this.name = name;
        this.value = value;
        this.groupName = groupName;
        this.description = description;
    }

    public name: PermissionNames;
    public value: PermissionValues;
    public groupName: string;
    public description: string;
}
