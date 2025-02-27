const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const followRedirect = require('follow-redirect-url');


const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [

        {id: 'name', title: 'NAME'},
        {id: 'title', title: 'TITLE'},
        {id: 'email', title: 'EMAIL'},
        {id: 'phone', title: 'PHONE'},
        {id: 'website', title: 'WEBSITE'},
    ]
});

const url = 'https://be.utdallas.edu/people/faculty/';

(async () => {
    const facultyProfileURLs = await scrapeFacultyProfileURLs();
    const records = [];
    for (const url of facultyProfileURLs) {
        console.log(`Scraping ${url}`);
        const facultyInfo = await scrapeFacultyProfile(url);
        records.push(facultyInfo);
    }

    const recordsWithRedirect = await Promise.all(records.map(async (record) => {
        const website_redirect = await followRedirect.startFollowing(record.website);
        return {
            ...record,
            website: website_redirect[website_redirect.length - 1].url
        };
    }));
    await csvWriter.writeRecords(recordsWithRedirect);
})();

async function scrapeFacultyProfile(url) {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const facultyData = $('.content .wp-block-columns .wp-block-column figure').parent();
    
    // Extract name from image alt attribute
    const name = $('.wp-block-post-title').text().trim();
    
    // Extract title - usually in the first <p> with <strong> tag
    const titleElement = facultyData.find('p strong').first();
    const title = titleElement.text().trim();
    
    // Extract email - look for mailto link
    const emailElement = facultyData.find('a[href^="mailto:"]');
    const email = emailElement.length ? emailElement.text().trim() : '';
    
    // Extract phone number - look for tel link
    const phoneElement = facultyData.find('a[href^="tel:"]');
    const phone = phoneElement.length ? phoneElement.text().trim() : '';
    
    // Extract personal web page URL - usually in the last <p> with <strong> tag or with "Personal Web Page" text
    let website = '';
    facultyData.find('p strong a, a:contains("Personal Web Page"), a:contains("Lab")').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            website = href;
        }
    });
    
    const facultyInfo = {
        name,
        title,
        email,
        phone,
        website
    };
    
    return facultyInfo;
}

async function scrapeFacultyProfileURLs() {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const facultyList = $('.content .wp-block-columns');
    const records = [];

    facultyList.each((index, element) => {
        // skip first row
        if (index === 0) return;

        const facultyName = $(element).find('.wp-block-column:nth-child(2)');
        const facultyURL = facultyName.find('a').attr('href');
        records.push(facultyURL);
    });
    return records;
}