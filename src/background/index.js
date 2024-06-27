chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ url: 'https://csfloatparser.com/*' }, (tabs) => {
    if (!tabs.length) {
      chrome.tabs.create({ url: 'https://csfloatparser.com/', active: true });

    } else {
      chrome.tabs.update(tabs[0].id, { active: true });
    }
  });
}); 

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	await chrome.alarms.create('saveBuffSkins', {
		delayInMinutes: 0.5,
		periodInMinutes: 360
	});
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name === 'saveBuffSkins') {
		console.log('Saving buffSkins')
		const buffSkins = await getBuffSkins()
		if (!buffSkins) return;
		chrome.storage.local.set({ buffSkins });
	}
});


chrome.runtime.onMessage.addListener((message) => {
	if (message.parse || message.parseFloat) {
		chrome.tabs.query({ url: 'https://csfloat.com/*' }, async (tabs) => {
			let tabId;
			if (!tabs.length) {
				const tab = await chrome.tabs.create({ url: 'https://csfloat.com/', active: false });
				tabId = tab.id;
				await new Promise(resolve => setTimeout(resolve, 2000));
			} else {
				tabId = tabs[0].id;
			}
			chrome.tabs.sendMessage(tabId, message);
    });
	}
	if (message.parsedSkins) {
		chrome.tabs.query({ url: ["https://csfloatparser.com/*", "*://localhost/*"] }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
	}
	if (message.parsedSkinsFloat) {
		chrome.tabs.query({ url: ["*://localhost/*", "https://float.csfloatparser.com/*"] }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
	}
});

async function getBuffSkins() {
	try {
		const response = await fetch('https://csfloatparser.com/skins')
		if (response.ok) {
			const data = await response.json()
			return data.reduce((obj, item) => {
				obj[item.name] = item.price;
				return obj;
			}, {});
		} else {
			console.log('Server error getting buffSkins: ' + response.status)
		}
	} catch (error) {
		console.log(error)
	}
}