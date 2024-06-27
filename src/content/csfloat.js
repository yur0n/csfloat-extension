
chrome.runtime.onMessage.addListener(async (message) => {
	if (message.parse) {
		const parsedSkins = await compareSkins(message.data);
		chrome.runtime.sendMessage({ parsedSkins });
	}
	if (message.parseFloat) {
		const parsedSkinsFloat = await compareSkinsFloat(message.data);
		chrome.runtime.sendMessage({ parsedSkinsFloat });
	}
});

async function compareSkins({ maxPrice, minPrice, maxProfit, minProfit }) {
	const parsedSkins = [];
	const skins = await getSkins(maxPrice, minPrice);
	if (skins.error) return skins;
	const buffSkins = (await chrome.storage.local.get('buffSkins')).buffSkins;
	if (!buffSkins) return { error: 'Skins from Buff163 are not updated yet, try a bit later', status: 404 };
	for (const skin of skins) {
		const buffPrice = buffSkins[skin.name];
		if (!buffPrice) continue;
		if ((buffPrice * 0.975) >= (skin.price * minProfit) && buffPrice <= (skin.price * maxProfit)) {
			const diff = (buffPrice / skin.price - 1) * 100
			console.log(`Skin: ${skin.name} | Buff price: ${buffPrice} | CSFloat price: ${skin.price} | Profit: ${diff.toFixed(2)}%`);

			parsedSkins.push({
				name: skin.name,
				buffPrice,
				csPrice: skin.price,
				profit: diff.toFixed(2),
				id: skin.id,
				photo: skin.photo,
				link: skin.link
			});
		}
	}
	return parsedSkins;
}

async function compareSkinsFloat(data) {
	let userSkins = data.items;
	const minProfit = data.minProfit;

	const itemsURL = chrome.runtime.getURL('user_item.txt');
	if (itemsURL) {
		const fileSkins = [];
		await fetch(itemsURL)
			.then(res => res.text())
			.then(text => {
				const lines = text.split('\n').trim();
				lines.forEach(line => {
					const [name, maxFloat, minFloat, maxPrice] = line.split(';').trim();
					fileSkins.push({ name, maxFloat, minFloat, maxPrice });
				});

			})
			.catch(e => console.log('file not added'));
		userSkins = [...userSkins, ...fileSkins];
	}
	if (!userSkins.length) return { error: 'No skins provided', status: 404 };
	const skins = await getSkins();
	if (skins.error) return skins;

	const parsedSkins = [];
	for (const userSkin of userSkins) {
		for (const skin of skins) {
			if (!skin.name.includes(userSkin.name)) continue;
			const { maxFloat, minFloat, maxPrice } = userSkin;
			if (!maxFloat || !minFloat || !maxPrice) continue;
			if (skin.price * minProfit < maxPrice && minFloat < skin.float && skin.float < maxFloat) {
				const diff = ((maxPrice / skin.price) * 100).toFixed(2);
				console.log(`Skin: ${skin.name} | CSFloat price: ${skin.price} | Float: ${skin.float} | Profit: ${diff}%`);

				parsedSkins.push({
					name: skin.name,
					csPrice: skin.price,
					float: skin.float,
					profit: diff,
					id: skin.id,
					photo: skin.photo,
					link: skin.link
				});
			}
		}
	}
	
	return parsedSkins;
}

async function getSkins(maxPrice, minPrice) {
	try {
		const skins = [];
		let url;

		if (!maxPrice || !minPrice) {
			url = `https://csfloat.com/api/v1/listings?limit=40&sort_by=most_recent&max_float=0.99999999&min_price=2000&max_price=70000`
		} else {
			url = `https://csfloat.com/api/v1/listings?limit=40&sort_by=most_recent&min_price=${minPrice * 100}&max_price=${maxPrice * 100}`
		}

		const res = await fetch(url);
		if (res.ok) {
				const data = await res.json()
				data.forEach(item => {
					skins.push({
						name: item.item.market_hash_name,
						price: item.price / 100,
						float: item.item.float_value,
						id: item.id,
						link: `https://csfloat.com/item/${item.id}`,
						photo: `https://community.cloudflare.steamstatic.com/economy/image/${item.item.icon_url}`
					});
				});
			return skins;
		} else {
			console.log('Failed to fetch: ' + res.status)
			return { error: res.statusText, status: res.status }
		}
	} catch (error) {
		console.log(error)
		return { error: error.message, status: 500 }
	}
}

