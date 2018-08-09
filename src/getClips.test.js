import getClips from './getClips';

test('getClips', async () => {
  const config = {
    limit: 5,
    language: 'tr',
    period: 'day',
    trending: false,
    game: '',
  };
  const urls = await getClips(config);

  expect(urls).toEqual(expect.arrayContaining([expect.any(Object)]));
});
