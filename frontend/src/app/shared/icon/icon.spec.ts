import { readdirSync } from 'node:fs';

import { TestBed } from '@angular/core/testing';

import { Icon } from './icon';
import { ICON_BASE_URL } from './icon.constants';
import { ICON_NAMES } from './icon.model';

describe('Icon', () => {
  it('masks the file named after the glyph, hidden from screen readers', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'star');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.getPropertyValue('--icon-url')).toBe("url('/assets/icons/star.svg')");
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });
});

/**
 * The glyph list and the files of `public/assets/icons`, kept in step.
 */
describe('ICON_NAMES', () => {
  it('names exactly the SVG files of the icons folder', () => {
    const files = readdirSync(`public${ICON_BASE_URL}`)
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.replace(/\.svg$/, ''));

    expect([...ICON_NAMES].sort()).toEqual(files.sort());
  });
});
