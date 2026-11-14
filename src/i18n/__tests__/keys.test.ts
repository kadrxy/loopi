import { en } from '../en';
import { tr } from '../tr';

describe('translations', () => {
  it('tr and en have exactly the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
  });

  it('no translation is empty', () => {
    for (const dict of [tr, en]) {
      for (const [key, value] of Object.entries(dict)) expect([key, value.trim().length > 0]).toEqual([key, true]);
    }
  });
});
