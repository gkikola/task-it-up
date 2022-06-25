import './styles/reset.css';
import './styles/licenses.css';
import AppInfo from './modules/appInfo';
import LicenseInfo from '../data/licenses/licenseInfo.json';

function compareByName(a, b) {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

function getLicenseInfo(id) {
  return LicenseInfo.licenses.find((license) => (
    license.id.toLowerCase() === id.toLowerCase()
  ));
}

function filterResources(type) {
  return LicenseInfo.resources.filter((resource) => (
    resource.type.toLowerCase() === type.toLowerCase()
  )).sort(compareByName);
}

function createToc(parent, entries) {
  const listElem = document.createElement('ul');
  entries.forEach((entry) => {
    const itemElem = document.createElement('li');
    const anchorElem = document.createElement('a');
    anchorElem.textContent = entry.title;
    anchorElem.href = `#${entry.id}`;
    itemElem.appendChild(anchorElem);
    listElem.appendChild(itemElem);
  });
  parent.appendChild(listElem);
}

function createParagraphs(parent, paragraphs) {
  paragraphs.forEach((paragraph) => {
    const pElem = document.createElement('p');
    paragraph.forEach((node) => {
      let nodeElem = null;
      switch (node.type) {
        case 'text':
          nodeElem = document.createTextNode(node.content);
          break;
        case 'link':
          nodeElem = document.createElement('a');
          nodeElem.textContent = node.content;
          nodeElem.href = node.url;
          break;
        default:
          break;
      }

      if (nodeElem) pElem.appendChild(nodeElem);
    });

    parent.appendChild(pElem);
  });
}

function createResourceList(parent) {
  const groups = [
    {
      name: 'Software',
      id: 'software',
      items: filterResources('software'),
    },
    {
      name: 'Fonts',
      id: 'fonts',
      items: filterResources('font'),
    }
  ];

  groups.forEach((group) => {
    const heading = document.createElement('h2');
    heading.textContent = group.name;
    heading.id = group.id;
    parent.appendChild(heading);

    group.items.forEach((item) => {
      const container = document.createElement('div');
      container.classList.add('resource-info');

      const itemName = document.createElement(item.homepage ? 'a' : 'div');
      itemName.textContent = item.name;
      itemName.classList.add('resource-info-item');
      if (item.homepage) itemName.href = item.homepage;
      container.appendChild(itemName);

      if (item.copyright) {
        const itemCopy = document.createElement('div');
        itemCopy.textContent = item.copyright;
        itemCopy.classList.add('resource-info-item');
        container.appendChild(itemCopy);
      }

      if (item.license) {
        const licenseInfo = getLicenseInfo(item.license);

        const itemLicense = document.createElement('div');
        itemLicense.classList.add('resource-info-item');

        const prefixNode = document.createTextNode('License: ');
        itemLicense.appendChild(prefixNode);

        const licenseLink = document.createElement('a');
        licenseLink.textContent = licenseInfo.name;
        licenseLink.href = `#license-${licenseInfo.id.toLowerCase()}`;
        itemLicense.appendChild(licenseLink);

        container.appendChild(itemLicense);
      }

      parent.appendChild(container);
    });
  });
}

function createLicenseList(parent) {
  const heading = document.createElement('h2');
  heading.textContent = 'License Text';
  heading.id = 'license-text';
  parent.appendChild(heading);

  const licenses = [...LicenseInfo.licenses].sort(compareByName);

  licenses.forEach((license) => {
    const container = document.createElement('div');
    container.classList.add('resource-info');
    container.id = `license-${license.id.toLowerCase()}`;

    const itemName = document.createElement(license.url ? 'a' : 'div');
    itemName.textContent = license.name;
    itemName.classList.add('resource-info-item');
    if (license.url) itemName.href = license.url;
    container.appendChild(itemName);

    const textContainer = document.createElement('div');
    textContainer.classList.add('license-text');
    import(`../data/licenses/${license.id.toLowerCase()}.txt`).then((text) => {
      textContainer.textContent = text.default;
    }).catch(() => {});
    container.appendChild(textContainer);

    parent.appendChild(container);
  });
}

function createPage(parent) {
  const content = document.createElement('div');
  content.classList.add('content');
  parent.appendChild(content);

  const header = document.createElement('h1');
  header.textContent = 'Licenses';
  content.appendChild(header);

  const appLicense = getLicenseInfo(AppInfo.license);
  const copySymbol = '\u00A9';
  const introParagraphs = [
    [
      {
        type: 'text',
        content: `${AppInfo.name} is copyright ${copySymbol} ${AppInfo.copyrightYears} `,
      },
      {
        type: 'link',
        content: AppInfo.author,
        url: AppInfo.authorWebsite,
      },
      {
        type: 'text',
        content: ` and is licensed under `
      },
      {
        type: 'link',
        content: appLicense.name,
        url: `#license-${appLicense.id.toLowerCase()}`,
      },
      {
        type: 'text',
        content: '.',
      },
    ],
    [
      {
        type: 'text',
        content: `Several third party packages are distributed along with ${AppInfo.name}. These packages are listed below, along with their license and copyright information.`,
      },
    ],
  ];

  const toc = [
    {
      title: 'Software',
      id: 'software',
    },
    {
      title: 'Fonts',
      id: 'fonts',
    },
    {
      title: 'License Text',
      id: 'license-text',
    },
  ];

  createParagraphs(content, introParagraphs);
  createToc(content, toc);
  createResourceList(content);
  createLicenseList(content);
}

createPage(document.body);
