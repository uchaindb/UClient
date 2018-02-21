
export class User {
    // Note: Using only optional constructor properties without backing store disables typescript's type checking for the type
    constructor(id?: string, nickName?: string, phoneNumber?: string, roles?: string[]) {

        this.id = id;
        this.nickName = nickName;
        this.phoneNumber = phoneNumber;
        this.roles = roles;
    }

    public id: string;
    public nickName: string;
    public phoneNumber: string;
    public isEnabled: boolean;
    public isLockedOut: boolean;
    public roles: string[];
}
