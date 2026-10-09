import {test,expect} from '@playwright/test';

async function expectWorkingContacts(page: import('@playwright/test').Page) {
  const contacts=page.locator('a.email-link');
  await expect(contacts).toHaveCount(2);
  for (const contact of await contacts.all()) {
    await expect(contact).toHaveAttribute('href',/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/);
    await contact.focus();
    await expect(contact).toHaveText(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
}

test('почта автора работает при прямом входе',async({page})=>{
  await page.goto('/about/');
  await expectWorkingContacts(page);
});

test('почта автора работает после перехода со статьи',async({page})=>{
  await page.goto('/blog/australia-visa-2026/');
  await page.locator('footer').getByRole('link',{name:'О проекте',exact:true}).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expectWorkingContacts(page);
});
