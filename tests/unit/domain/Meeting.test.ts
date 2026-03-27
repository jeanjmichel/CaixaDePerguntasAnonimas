import { Meeting } from '@/domain/entities/Meeting';
import { createMeeting, createOpenMeeting } from '../../helpers/factories';

describe('Meeting', () => {
  describe('construction', () => {
    it('should create a meeting with all properties', () => {
      const now = new Date();
      const scheduled = new Date(now.getTime() + 86400000);
      const meeting = createMeeting({
        id: 'm1',
        title: 'Monthly Townhall',
        scheduledAt: scheduled,
        createdAt: now,
        updatedAt: now,
      });

      expect(meeting.id).toBe('m1');
      expect(meeting.title).toBe('Monthly Townhall');
      expect(meeting.scheduledAt).toEqual(scheduled);
      expect(meeting.isOpenForSubmissions).toBe(false);
      expect(meeting.openedAt).toBeNull();
      expect(meeting.closedAt).toBeNull();
    });
  });

  describe('open', () => {
    it('should set isOpenForSubmissions to true', () => {
      const meeting = createMeeting();
      const opened = meeting.open();

      expect(opened.isOpenForSubmissions).toBe(true);
    });

    it('should set openedAt to current time', () => {
      const meeting = createMeeting();
      const before = new Date();
      const opened = meeting.open();

      expect(opened.openedAt).toBeInstanceOf(Date);
      expect(opened.openedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should clear closedAt', () => {
      const meeting = createMeeting({ closedAt: new Date() });
      const opened = meeting.open();

      expect(opened.closedAt).toBeNull();
    });

    it('should update updatedAt', () => {
      const meeting = createMeeting();
      const opened = meeting.open();

      expect(opened.updatedAt.getTime()).toBeGreaterThanOrEqual(meeting.updatedAt.getTime());
    });
  });

  describe('close', () => {
    it('should set isOpenForSubmissions to false', () => {
      const meeting = createOpenMeeting();
      const closed = meeting.close();

      expect(closed.isOpenForSubmissions).toBe(false);
    });

    it('should set closedAt to current time', () => {
      const meeting = createOpenMeeting();
      const before = new Date();
      const closed = meeting.close();

      expect(closed.closedAt).toBeInstanceOf(Date);
      expect(closed.closedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should preserve openedAt', () => {
      const openedAt = new Date('2026-01-01T10:00:00Z');
      const meeting = createOpenMeeting({ openedAt });
      const closed = meeting.close();

      expect(closed.openedAt).toEqual(openedAt);
    });
  });

  describe('updateDetails', () => {
    it('should update title and scheduledAt', () => {
      const meeting = createMeeting({ title: 'Old Title' });
      const newDate = new Date('2026-06-01T14:00:00Z');
      const updated = meeting.updateDetails('New Title', newDate);

      expect(updated.title).toBe('New Title');
      expect(updated.scheduledAt).toEqual(newDate);
    });

    it('should not change other properties', () => {
      const meeting = createOpenMeeting();
      const updated = meeting.updateDetails('Updated', new Date());

      expect(updated.id).toBe(meeting.id);
      expect(updated.isOpenForSubmissions).toBe(meeting.isOpenForSubmissions);
      expect(updated.openedAt).toEqual(meeting.openedAt);
    });

    it('should update updatedAt', () => {
      const meeting = createMeeting();
      const updated = meeting.updateDetails('New', new Date());

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(meeting.updatedAt.getTime());
    });
  });

  describe('toProps', () => {
    it('should return all properties as plain object', () => {
      const meeting = createMeeting({ id: 'm1', title: 'Test' });
      const props = meeting.toProps();

      expect(props.id).toBe('m1');
      expect(props.title).toBe('Test');
      expect(props).toHaveProperty('scheduledAt');
      expect(props).toHaveProperty('isOpenForSubmissions');
      expect(props).toHaveProperty('openedAt');
      expect(props).toHaveProperty('closedAt');
      expect(props).toHaveProperty('createdAt');
      expect(props).toHaveProperty('updatedAt');
    });
  });
});
