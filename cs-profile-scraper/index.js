const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const followRedirect = require('follow-redirect-url');

const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [

        {id: 'name', title: 'NAME'},
        {id: 'position', title: 'POSITION'},
        {id: 'email', title: 'EMAIL'},
        {id: 'phone', title: 'PHONE'},
        {id: 'website', title: 'WEBSITE'},
        {id: 'optional_website', title: 'OPTIONAL WEBSITE'}
    ]
});

// Helper function to clean text of special characters and extra whitespace
const cleanText = (text) => {
    if (!text) return '';
    
    // Replace non-breaking spaces and other special characters
    return text
        .replace(/\u00A0/g, ' ')  // Replace non-breaking space
        .replace(/[^\x20-\x7E]/g, ' ')  // Replace other non-ASCII chars with space
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();  // Remove leading/trailing whitespace
};

const url = 'https://cs.utdallas.edu/people/faculty/';

(async () => {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const facultyList = $('.wp-block-table tbody tr');
    const records = [];
    facultyList.each((index, element) => {
        const nameAndPosition = $(element).find('td:nth-child(1)').html().split('<br>');
        const info = $(element).find('td:nth-child(2)').html().split('<br>');

        // Handle both cases: name with link and name without link
        let name;
        let website;
        
        // Create a new Cheerio instance for the name part
        const $nameFragment = cheerio.load(nameAndPosition[0]);
        const nameLink = $nameFragment('a');
        
        if (nameLink.length > 0) {
            // Case 1: Name has a link
            name = cleanText(nameLink.text().trim());
            website = nameLink.attr('href');
        } else {
            // Case 2: Name has no link
            name = cleanText(nameAndPosition[0].trim());
            website = '';
        }

        const position = cleanText(nameAndPosition[1] ? nameAndPosition[1].trim() : '');
        
        // Create Cheerio instances for the info parts
        const $infoFragment0 = info[0] ? cheerio.load(info[0]) : cheerio.load('');
        const $infoFragment1 = info[1] ? cheerio.load(info[1]) : cheerio.load('');
        const $infoFragment2 = info[2] ? cheerio.load(info[2]) : cheerio.load('');
        
        const email = cleanText($infoFragment0('a[href^="mailto:"]').text().trim() || $infoFragment0.text().trim());
        const phone = cleanText($infoFragment1('a[href^="tel:"]').text().trim() || (info[1] ? info[1].trim() : ''));
        const optional_website = $infoFragment2('a[href^="http"]').attr('href') || '';

        records.push({
            name,
            position,
            email,
            phone,
            website,
            optional_website,
        });
    });

    const recordsWithRedirect = await Promise.all(records.map(async (record) => {
        const optional_website_redirect = await followRedirect.startFollowing(record.optional_website);
        return {
            ...record,
            optional_website: optional_website_redirect[optional_website_redirect.length - 1].url
        };
    }));

    await csvWriter.writeRecords(recordsWithRedirect);
})();


