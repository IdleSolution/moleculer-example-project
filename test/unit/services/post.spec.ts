import { ServiceBroker } from "moleculer";
import TestService from "../../../services/posts.service"

describe('test post service', () => {
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);

	jest.spyOn(service, "transformDocuments");
    jest.spyOn(service.adapter, "insert");

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    test('should create post', async () => {
        service.adapter.insert.mockImplementation(() => Promise.resolve({
            title: 'test',
            content: 'test',
            id: 1,
        }))
	    service.transformDocuments.mockClear();

        const res = await broker.call('posts.get', { title: 'test', content: 'test' });
        expect(res).toEqual({title: 'test', content: 'test'});

		expect(service.transformDocuments).toHaveBeenCalledTimes(1);


    })
})