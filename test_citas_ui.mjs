import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://localhost:5177...');
    await page.goto('http://localhost:5177/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(1500);
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'test_home.png', fullPage: true });
    console.log('Screenshot of home page saved');
    
    // Check what's visible on the page
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText.substring(0, 200));
    
    // Try to navigate to /citas
    console.log('\nTrying to navigate to /citas...');
    await page.goto('http://localhost:5177/citas', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.waitForTimeout(1000);
    const citasText = await page.textContent('body');
    console.log('Citas page loaded:', !!citasText);
    
    // Take screenshot of citas page
    await page.screenshot({ path: 'test_citas_page.png', fullPage: true });
    console.log('Screenshot of citas page saved');
    
    // Look for the "Nueva cita" button
    const newCitaBtn = await page.$('button:has-text("Cita")');
    if (newCitaBtn) {
      console.log('Found "Nueva cita" button, clicking...');
      await newCitaBtn.click();
      await page.waitForTimeout(500);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'test_nueva_cita_form.png', fullPage: true });
      console.log('Screenshot of new cita form saved');
      
      // Check if the client name input is visible
      const clientInput = await page.$('input[placeholder*="cliente"]');
      console.log('Client input field found:', !!clientInput);
      
      // Try to type in the field
      if (clientInput) {
        console.log('Typing "Car" in the client field...');
        await clientInput.focus();
        await clientInput.type('Car', { delay: 100 });
        
        await page.waitForTimeout(800);
        
        // Take screenshot to see the dropdown
        await page.screenshot({ path: 'test_autocomplete_dropdown.png', fullPage: true });
        console.log('Screenshot of autocomplete dropdown saved');
        
        // Check if dropdown is visible
        const dropdown = await page.$('div:has-text("Carmen")');
        console.log('Dropdown with client names visible:', !!dropdown);
      }
    } else {
      console.log('Could not find "Nueva cita" button');
      const buttons = await page.$$('button');
      console.log('Available buttons:', buttons.length);
      const allText = await page.textContent('body');
      console.log('Page text preview:', allText.substring(0, 300));
    }
    
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

test();
