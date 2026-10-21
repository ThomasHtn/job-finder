import { TestBed } from '@angular/core/testing';

import { Prose } from './prose';

describe('Prose', () => {
  it('renders paragraphs and lists from the plain text', () => {
    const fixture = TestBed.createComponent(Prose);
    fixture.componentRef.setInput('text', 'Vos missions :\n- Concevoir\n- Livrer\n\nTrois ans.');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.prose__paragraph')).toHaveLength(2);
    expect(host.querySelector('.prose__paragraph--lead')?.textContent).toBe('Vos missions :');
    expect(Array.from(host.querySelectorAll('li')).map((item) => item.textContent)).toEqual([
      'Concevoir',
      'Livrer',
    ]);
  });
});
