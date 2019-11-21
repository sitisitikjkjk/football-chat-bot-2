import { createContextStub } from '../../test/stubs/context.stub';
import { createModuleStub } from '../../test/stubs/actions.module.stub';

import { AppEmitter } from '../common/event-bus.service';
import { StorageService } from '../storage/storage.service';
import { Chat } from '../storage/models/chat';
import { Event } from '../storage/models/event';

describe('EventAddAction', () => {
    let appEmitter: AppEmitter;
    let storageService: StorageService;

    beforeAll(async () => {
        const module = await createModuleStub();

        appEmitter = module.get<AppEmitter>(AppEmitter);
        storageService = module.get<StorageService>(StorageService);
    });

    beforeEach(async () => {
        await storageService.connection.getRepository(Event).clear();
        await storageService.connection.getRepository(Chat).clear();
    });

    describe('handle event', () => {
        it('should create chat if it does not exist yet', async () => {
            const chatCountBefore: number = await storageService.connection.getRepository(Chat).count();
            expect(chatCountBefore).toBe(0);

            await new Promise((resolve) => {
                const ctx = createContextStub({lang: 'en', chatId: 1}, resolve);
                appEmitter.emit(appEmitter.EVENT_ADD, ctx);
            });

            const chatCountAfter: number = await storageService.connection.getRepository(Chat).count();
            expect(chatCountAfter).toBe(1);
        });

        it('should create new event and mark it as active', async () => {
            const eventsBefore: number = await storageService.connection.getRepository(Event).count();
            expect(eventsBefore).toBe(0);

            await new Promise((resolve) => {
                const ctx = createContextStub({lang: 'en', chatId: 1}, resolve);
                appEmitter.emit(appEmitter.EVENT_ADD, ctx);
            });

            const events: Event[] = await storageService.connection.getRepository(Event).find({});

            expect(events).toHaveLength(1);
            expect(events[0].active).toBe(true);
        });

        it('should make all existed events inactive', async () => {
            const eventsBefore: number = await storageService.connection.getRepository(Event).count();
            expect(eventsBefore).toBe(0);

            let events: Event[];

            await new Promise((resolve) => {
                const ctx = createContextStub({lang: 'en', chatId: 1}, resolve);
                appEmitter.emit(appEmitter.EVENT_ADD, ctx);
            });

            events = await storageService.connection.getRepository(Event).find({});
            expect(events[0].active).toBe(true);

            await new Promise((resolve) => {
                const ctx = createContextStub({lang: 'en', chatId: 1}, resolve);
                appEmitter.emit(appEmitter.EVENT_ADD, ctx);
            });

            events = await storageService.connection.getRepository(Event).find({});
            expect(events[0].active).toBe(false);
            expect(events[1].active).toBe(true);
        });

        it('should return information about created event', async () => {
            const jsonRes: string = await new Promise((resolve) => {
                const ctx = createContextStub({lang: 'en', chatId: 1}, resolve);
                appEmitter.emit(appEmitter.EVENT_ADD, ctx);
            });

            const {date} = JSON.parse(jsonRes);
            expect(date).toMatch(/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/);
        });
    });
});