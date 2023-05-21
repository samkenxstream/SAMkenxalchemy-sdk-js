import {
  AddressActivityWebhook,
  Alchemy,
  CustomGraphqlWebhook,
  Network,
  NftActivityWebhook,
  NftFilter,
  NftMetadataUpdateWebhook,
  WebhookType
} from '../../src';
import { loadAlchemyEnv } from '../test-util';

jest.setTimeout(50000);
describe('E2E integration tests', () => {
  let alchemy: Alchemy;
  let appId: string;
  const activityAddresses = [
    '0x6f8d0c2a2c3a189803f5c6482c88be46a55058c1',
    '0x48ea66f94518534ecbc863fbf521896d52b025d9',
    '0xfdb16996831753d5331ff813c29a93c76834a0ad'
  ];
  const nftFilters = [
    {
      contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
      tokenId: 234
    },
    {
      contractAddress: '0x17dc95f9052f86ed576af55b018360f853e19ac2',
      tokenId: '345'
    }
  ];

  const webhookUrl = 'https://temp-site.ngrok.io';
  const graphqlQuery = '{ block { hash } }';

  let addressWh: AddressActivityWebhook;
  let nftWh: NftActivityWebhook;
  let nftMetadataWh: NftMetadataUpdateWebhook;
  let customWh: CustomGraphqlWebhook;

  async function createInitialWebhooks(): Promise<void> {
    addressWh = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.ADDRESS_ACTIVITY,
      { addresses: activityAddresses }
    );
    nftWh = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.NFT_ACTIVITY,
      { filters: nftFilters, network: Network.ETH_MAINNET }
    );
    nftMetadataWh = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.NFT_METADATA_UPDATE,
      { filters: nftFilters, network: Network.ETH_MAINNET }
    );
    customWh = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.GRAPHQL,
      { graphqlQuery, network: Network.ETH_MAINNET }
    );
  }

  beforeAll(async () => {
    await loadAlchemyEnv();
    appId = process.env.ALCHEMY_APP_ID!;

    alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      authToken: process.env.ALCHEMY_AUTH_TOKEN
    });

    await createInitialWebhooks();
  });

  describe('has valid network mappings', () => {
    const UNSUPPORTED_NETWORKS = [
      Network.ETH_ROPSTEN,
      Network.ETH_KOVAN,
      Network.ETH_RINKEBY,
      Network.OPT_KOVAN,
      Network.ARB_RINKEBY,
      Network.ASTAR_MAINNET,
      Network.POLYGONZKEVM_MAINNET,
      Network.POLYGONZKEVM_TESTNET
    ];
    const testAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    function testNetwork(network: Network) {
      it(`can create a webhook on ${network}`, async () => {
        console.log('testing', network);
        const nftTest = await alchemy.notify.createWebhook(
          webhookUrl,
          WebhookType.ADDRESS_ACTIVITY,
          { addresses: [testAddress], network }
        );

        await alchemy.notify.deleteWebhook(nftTest.id);
      });
    }

    for (const network of Object.values(Network)) {
      if (!UNSUPPORTED_NETWORKS.includes(network)) {
        testNetwork(network);
      }
    }
  });

  it('getAllWebhooks()', async () => {
    const all = await alchemy.notify.getAllWebhooks();
    expect(all.totalCount).toBeGreaterThan(0);
    expect(all.webhooks.length).toEqual(all.totalCount);
  });

  it('getGraphqlQuery()', async () => {
    let response = await alchemy.notify.getGraphqlQuery(customWh);
    expect(response.graphqlQuery).toEqual(graphqlQuery);
    response = await alchemy.notify.getGraphqlQuery(customWh.id);
    expect(response.graphqlQuery).toEqual(graphqlQuery);
  });

  it('getAddresses()', async () => {
    let response = await alchemy.notify.getAddresses(addressWh);
    // Convert to lowercase since ENS resolution capitalizes hex string.
    expect(response.addresses.map(x => x.toLowerCase()).sort()).toEqual(
      activityAddresses.sort()
    );

    response = await alchemy.notify.getAddresses(addressWh.id);
    expect(response.addresses.map(x => x.toLowerCase()).sort()).toEqual(
      activityAddresses.sort()
    );
  });

  it('getAddresses() with limit', async () => {
    const response = await alchemy.notify.getAddresses(addressWh, {
      limit: 1
    });
    expect(response.totalCount).toEqual(3);
    expect(response.addresses.length).toEqual(1);
    expect(response.pageKey).toBeDefined();
    const response2 = await alchemy.notify.getAddresses(addressWh, {
      limit: 1,
      pageKey: response.pageKey
    });
    expect(response2.addresses.length).toEqual(1);
    expect(response2).not.toContain(response.addresses[0]);
  });

  it('getNftFilters()', async () => {
    const expectedNftFilters = [
      {
        contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
        tokenId: '234'
      },
      {
        contractAddress: '0x17dc95f9052f86ed576af55b018360f853e19ac2',
        tokenId: '345'
      }
    ];

    let response = await alchemy.notify.getNftFilters(nftWh);
    const sortFn = (a: NftFilter, b: NftFilter) =>
      (a?.tokenId ?? -1) < (b.tokenId ?? -1) ? 1 : -1;
    expect(response.filters.sort(sortFn)).toEqual(
      expectedNftFilters.sort(sortFn)
    );

    response = await alchemy.notify.getNftFilters(nftWh.id);
    expect(response.filters.sort(sortFn)).toEqual(
      expectedNftFilters.sort(sortFn)
    );
  });

  it('getNftFilters() with limit', async () => {
    const response = await alchemy.notify.getNftFilters(nftWh, {
      limit: 1
    });
    expect(response.totalCount).toEqual(2);
    expect(response.filters.length).toEqual(1);
    expect(response.pageKey).toBeDefined();
    const response2 = await alchemy.notify.getNftFilters(nftWh, {
      limit: 1,
      pageKey: response.pageKey
    });
    expect(response2.filters.length).toEqual(1);
    expect(response2).not.toContain(response.filters[0]);
  });

  it('create and delete MinedTransactionWebhook', async () => {
    const minedTxWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.MINED_TRANSACTION,
      { appId }
    );
    expect(minedTxWebhook.url).toEqual(webhookUrl);
    expect(minedTxWebhook.type).toEqual(WebhookType.MINED_TRANSACTION);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === minedTxWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(minedTxWebhook);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === minedTxWebhook.id).length
    ).toEqual(0);
  });

  it('create and delete DroppedTransactionWebhook', async () => {
    const droppedTxWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.DROPPED_TRANSACTION,
      { appId }
    );
    expect(droppedTxWebhook.url).toEqual(webhookUrl);
    expect(droppedTxWebhook.type).toEqual(WebhookType.DROPPED_TRANSACTION);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === droppedTxWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(droppedTxWebhook);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === droppedTxWebhook.id).length
    ).toEqual(0);
  });

  it('create and delete AddressActivityWebhook', async () => {
    const addressWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.ADDRESS_ACTIVITY,
      { addresses: activityAddresses, network: Network.OPT_MAINNET }
    );
    expect(addressWebhook.url).toEqual(webhookUrl);
    expect(addressWebhook.type).toEqual(WebhookType.ADDRESS_ACTIVITY);
    expect(addressWebhook.network).toEqual(Network.OPT_MAINNET);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === addressWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(addressWebhook);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === addressWebhook.id).length
    ).toEqual(0);
  });

  it('create and delete CustomWebhook', async () => {
    const customWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.GRAPHQL,
      { graphqlQuery, network: Network.ETH_GOERLI }
    );
    expect(customWebhook.url).toEqual(webhookUrl);
    expect(customWebhook.type).toEqual(WebhookType.GRAPHQL);
    expect(customWebhook.network).toEqual(Network.ETH_GOERLI);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === customWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(customWebhook);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === customWebhook.id).length
    ).toEqual(0);
  });

  it('create AddressActivityWebhook with ENS', async () => {
    const rawAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const addressWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.ADDRESS_ACTIVITY,
      { addresses: ['vitalik.eth'], network: Network.OPT_MAINNET }
    );

    const response = await alchemy.notify.getAddresses(addressWebhook);
    expect(response.addresses).toContain(rawAddress);
  });

  it('create and delete NftActivityWebhook', async () => {
    const nftActivityWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.NFT_ACTIVITY,
      { filters: nftFilters, network: Network.ETH_GOERLI }
    );
    expect(nftActivityWebhook.url).toEqual(webhookUrl);
    expect(nftActivityWebhook.type).toEqual(WebhookType.NFT_ACTIVITY);
    expect(nftActivityWebhook.network).toEqual(Network.ETH_GOERLI);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === nftActivityWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(nftActivityWebhook.id);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === nftActivityWebhook.id).length
    ).toEqual(0);
  });

  it('create and delete NftActivityWebhook', async () => {
    const nftActivityWebhook = await alchemy.notify.createWebhook(
      webhookUrl,
      WebhookType.NFT_METADATA_UPDATE,
      { filters: nftFilters, network: Network.ETH_GOERLI }
    );
    expect(nftActivityWebhook.url).toEqual(webhookUrl);
    expect(nftActivityWebhook.type).toEqual(WebhookType.NFT_METADATA_UPDATE);
    expect(nftActivityWebhook.network).toEqual(Network.ETH_GOERLI);
    let response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === nftActivityWebhook.id).length
    ).toEqual(1);

    await alchemy.notify.deleteWebhook(nftActivityWebhook.id);
    response = await alchemy.notify.getAllWebhooks();
    expect(
      response.webhooks.filter(wh => wh.id === nftActivityWebhook.id).length
    ).toEqual(0);
  });

  it('update NftActivityWebhook filter with same filter', async () => {
    const addFilters = [
      // Duplicate filter
      {
        contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
        tokenId: '234'
      },
      // New Filter
      {
        contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
        tokenId: '123'
      }
    ];

    const removeFilters = [
      {
        contractAddress: '0x17dc95f9052f86ed576af55b018360f853e19ac2',
        tokenId: 345
      }
    ];

    await alchemy.notify.updateWebhook(nftWh, {
      addFilters,
      removeFilters
    });

    const response = await alchemy.notify.getNftFilters(nftWh);
    expect(response.filters.length).toEqual(2);

    await alchemy.notify.updateWebhook(nftWh, {
      removeFilters
    });

    await alchemy.notify.updateWebhook(nftWh, {
      addFilters
    });
  });

  it('update NftActivityWebhook status', async () => {
    await alchemy.notify.updateWebhook(nftWh.id, {
      isActive: false
    });
    const response = await alchemy.notify.getAllWebhooks();
    const updated = response.webhooks.filter(wh => wh.id === nftWh.id);
    expect(updated.length).toEqual(1);
    expect(updated[0].isActive).toEqual(false);
  });

  it('update CustomWebhook status', async () => {
    const webhooks = await alchemy.notify.getAllWebhooks();
    const filteredWebhooks = webhooks.webhooks.filter(
      webhook => webhook.id === customWh.id
    );
    expect(filteredWebhooks.length).toEqual(1);
    const customWebhook = filteredWebhooks[0];
    const currStatus = customWebhook.isActive;
    await alchemy.notify.updateWebhook(customWebhook.id, {
      isActive: !currStatus
    });
    const response = await alchemy.notify.getAllWebhooks();
    const updated = response.webhooks.filter(wh => wh.id === customWebhook.id);
    expect(updated.length).toEqual(1);
    expect(updated[0].isActive).toEqual(!currStatus);
  });

  it('update NftMetadataUpdateWebhook status', async () => {
    await alchemy.notify.updateWebhook(nftMetadataWh.id, {
      isActive: false
    });
    const response = await alchemy.notify.getAllWebhooks();
    const updated = response.webhooks.filter(wh => wh.id === nftMetadataWh.id);
    expect(updated.length).toEqual(1);
    expect(updated[0].isActive).toEqual(false);
  });

  it('update NftMetadataUpdateWebhook filter with same filter', async () => {
    const addMetadataFilters = [
      // Duplicate filter
      {
        contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
        tokenId: '234'
      },
      // New Filter
      {
        contractAddress: '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656',
        tokenId: '123'
      }
    ];

    const removeMetadataFilters = [
      {
        contractAddress: '0x17dc95f9052f86ed576af55b018360f853e19ac2',
        tokenId: 345
      }
    ];

    await alchemy.notify.updateWebhook(nftWh, {
      addFilters: addMetadataFilters,
      removeFilters: removeMetadataFilters
    });

    const response = await alchemy.notify.getNftFilters(nftWh);
    expect(response.filters.length).toEqual(2);

    await alchemy.notify.updateWebhook(nftWh, {
      removeFilters: removeMetadataFilters
    });

    await alchemy.notify.updateWebhook(nftWh, {
      addFilters: addMetadataFilters
    });
  });

  it('update AddressActivityWebhook address', async () => {
    const addAddress = '0x7f268357A8c2552623316e2562D90e642bB538E5';
    const removeAddress = '0xfdb16996831753d5331ff813c29a93c76834a0ad';
    await alchemy.notify.updateWebhook(addressWh, {
      addAddresses: [addAddress],
      removeAddresses: [removeAddress]
    });
    const response = await alchemy.notify.getAddresses(addressWh);
    expect(response.addresses.length).toEqual(3);
    expect(response.addresses).toContain(addAddress);
    expect(response.addresses).not.toContain(removeAddress);

    await alchemy.notify.updateWebhook(addressWh, {
      removeAddresses: [removeAddress]
    });

    await alchemy.notify.updateWebhook(addressWh, {
      addAddresses: [addAddress]
    });
  });

  it('update AddressActivityWebhook address with ENS', async () => {
    const addAddress = 'vitalik.eth';
    const rawAddAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    await alchemy.notify.updateWebhook(addressWh, {
      addAddresses: [addAddress]
    });
    const response = await alchemy.notify.getAddresses(addressWh);
    expect(response.addresses).toContain(rawAddAddress);
  });

  it('override AddressActivityWebhook address', async () => {
    const newAddresses = ['0x7f268357A8c2552623316e2562D90e642bB538E5'];
    await alchemy.notify.updateWebhook(addressWh, {
      newAddresses
    });
    const response = await alchemy.notify.getAddresses(addressWh);
    expect(response.addresses.length).toEqual(1);
    expect(response.addresses[0]).toEqual(newAddresses[0]);
  });

  it('update AddressActivityWebhook status', async () => {
    await alchemy.notify.updateWebhook(addressWh, {
      isActive: false
    });
    const response = await alchemy.notify.getAllWebhooks();
    const updated = response.webhooks.filter(wh => wh.id === addressWh.id);
    expect(updated.length).toEqual(1);
    expect(updated[0].isActive).toEqual(false);
  });

  it('cleans up', async () => {
    const response = await alchemy.notify.getAllWebhooks();
    const tests = response.webhooks.filter(wh => wh.url === webhookUrl);

    await Promise.allSettled(tests.map(wh => alchemy.notify.deleteWebhook(wh)));
    const response2 = await alchemy.notify.getAllWebhooks();
    const remaining = response2.webhooks.filter(wh => wh.url === webhookUrl);
    expect(remaining.length).toEqual(0);
  });
});
