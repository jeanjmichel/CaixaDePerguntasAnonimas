export interface AdminProps {
  id: string;
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Admin {
  readonly id: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly mustChangePassword: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: AdminProps) {
    this.id = props.id;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.mustChangePassword = props.mustChangePassword;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  changePassword(newPasswordHash: string): Admin {
    return new Admin({
      ...this.toProps(),
      passwordHash: newPasswordHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    });
  }

  toggleActive(isActive: boolean): Admin {
    return new Admin({
      ...this.toProps(),
      isActive,
      updatedAt: new Date(),
    });
  }

  toProps(): AdminProps {
    return {
      id: this.id,
      username: this.username,
      passwordHash: this.passwordHash,
      mustChangePassword: this.mustChangePassword,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
