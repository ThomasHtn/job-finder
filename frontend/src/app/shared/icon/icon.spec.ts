import { TestBed } from '@angular/core/testing';

import { Icon } from './icon';

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
