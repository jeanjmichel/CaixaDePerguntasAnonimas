export interface MeetingProps {
  id: string;
  title: string;
  scheduledAt: Date;
  isOpenForSubmissions: boolean;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Meeting {
  readonly id: string;
  readonly title: string;
  readonly scheduledAt: Date;
  readonly isOpenForSubmissions: boolean;
  readonly openedAt: Date | null;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: MeetingProps) {
    this.id = props.id;
    this.title = props.title;
    this.scheduledAt = props.scheduledAt;
    this.isOpenForSubmissions = props.isOpenForSubmissions;
    this.openedAt = props.openedAt;
    this.closedAt = props.closedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  open(): Meeting {
    const now = new Date();
    return new Meeting({
      ...this.toProps(),
      isOpenForSubmissions: true,
      openedAt: now,
      closedAt: null,
      updatedAt: now,
    });
  }

  close(): Meeting {
    const now = new Date();
    return new Meeting({
      ...this.toProps(),
      isOpenForSubmissions: false,
      closedAt: now,
      updatedAt: now,
    });
  }

  updateDetails(title: string, scheduledAt: Date): Meeting {
    return new Meeting({
      ...this.toProps(),
      title,
      scheduledAt,
      updatedAt: new Date(),
    });
  }

  toProps(): MeetingProps {
    return {
      id: this.id,
      title: this.title,
      scheduledAt: this.scheduledAt,
      isOpenForSubmissions: this.isOpenForSubmissions,
      openedAt: this.openedAt,
      closedAt: this.closedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
