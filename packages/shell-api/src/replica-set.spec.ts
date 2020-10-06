import { bson, ServiceProvider, Cursor as ServiceProviderCursor } from '@mongosh/service-provider-core';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import ShellInternalState from './shell-internal-state';
import { signatures } from './decorators';
import ReplicaSet from './replica-set';
import { EventEmitter } from 'events';
import { expect } from 'chai';
import Mongo from './mongo';
import {
  ADMIN_DB,
  ALL_PLATFORMS,
  ALL_SERVER_VERSIONS,
  ALL_TOPOLOGIES,
  asShellResult
} from './enums';

describe('ReplicaSet', () => {
  describe('help', () => {
    const apiClass: any = new ReplicaSet({});

    it('calls help function', async() => {
      expect((await apiClass.help()[asShellResult]()).type).to.equal('Help');
      expect((await apiClass.help[asShellResult]()).type).to.equal('Help');
    });

    it('calls help function for methods', async() => {
      expect((await apiClass.initiate.help()[asShellResult]()).type).to.equal('Help');
      expect((await apiClass.initiate.help[asShellResult]()).type).to.equal('Help');
    });
  });

  describe('signatures', () => {
    it('type', () => {
      expect(signatures.ReplicaSet.type).to.equal('ReplicaSet');
    });

    it('attributes', () => {
      expect(signatures.ReplicaSet.attributes.initiate).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });

    it('hasAsyncChild', () => {
      expect(signatures.ReplicaSet.hasAsyncChild).to.equal(true);
    });
  });

  describe('commands', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let rs: ReplicaSet;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState);
      rs = new ReplicaSet(mongo);
    });

    describe('initiate', () => {
      const configDoc = {
        _id: 'my_replica_set',
        members: [
          { _id: 0, host: 'rs1.example.net:27017' },
          { _id: 1, host: 'rs2.example.net:27017' },
          { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
        ]
      };

      it('calls serviceProvider.runCommandWithCheck without optional arg', async() => {
        await rs.initiate();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetInitiate: {}
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await rs.initiate(configDoc);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetInitiate: configDoc
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.initiate(configDoc);

        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const caughtError = await rs.initiate(configDoc)
          .catch(e => e);

        expect(caughtError).to.equal(expectedError);
      });
    });

    describe('config', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await rs.config();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        // not using the full object for expected result, as we should check this in an e2e test.
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.config();

        expect(result).to.deep.equal(expectedResult.config);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const caughtError = await rs.config()
          .catch(e => e);

        expect(caughtError).to.equal(expectedError);
      });

      it('calls find if serviceProvider.runCommandWithCheck rejects with command not found', async() => {
        const expectedError = new Error() as any;
        expectedError.codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const expectedResult = { res: true };
        const findCursor = stubInterface<ServiceProviderCursor>();
        findCursor.next.resolves(expectedResult);
        serviceProvider.find.returns(findCursor);

        const conf = await rs.config();
        expect(serviceProvider.find).to.have.been.calledWith(
          'local', 'system.replset', {}, {}
        );
        expect(conf).to.deep.equal(expectedResult);
      });
    });

    describe('reconfig', () => {
      const configDoc = {
        _id: 'my_replica_set',
        members: [
          { _id: 0, host: 'rs1.example.net:27017' },
          { _id: 1, host: 'rs2.example.net:27017' },
          { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
        ]
      };

      it('calls serviceProvider.runCommandWithCheck without optional arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ config: { version: 1 } });
        await rs.reconfig(configDoc);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              _id: 'my_replica_set',
              members: [
                { _id: 0, host: 'rs1.example.net:27017' },
                { _id: 1, host: 'rs2.example.net:27017' },
                { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
              ],
              version: 2
            }
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ config: 1 });
        await rs.reconfig(configDoc, { force: true });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              _id: 'my_replica_set',
              members: [
                { _id: 0, host: 'rs1.example.net:27017' },
                { _id: 1, host: 'rs2.example.net:27017' },
                { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
              ],
              version: 1
            },
            force: true
          }
        );
      });
    });
    describe('status', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.status();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetGetStatus: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.status();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.status()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('isMaster', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.isMaster();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            isMaster: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.isMaster();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.isMaster()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
  });
});
