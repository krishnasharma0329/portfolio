import {useLanguage} from "/src/providers/LanguageProvider.jsx"
import {useUtils} from "/src/helpers/utils.js"
import {forEach} from "react-bootstrap/ElementChildren"

export const useParser = () => {
    const {getString, getTranslation, selectedLanguageId} = useLanguage()
    const utils = useUtils()

    const parseArticleData = (articleData, supportedFormats) => {
        supportedFormats = supportedFormats || []
        articleData.locales = articleData.locales || {}
        articleData.items = articleData.items || []
        articleData.categories = articleData.categories || []

        if(supportedFormats.length && supportedFormats.includes(articleData.config.format) === false) {
            console.warn(`The format ${articleData.config.format} is invalid for the article with ID ${articleData.id}.`)
        }

        return {
            id: articleData.id,
            title: getTranslation(articleData.locales, 'title', true),
            items: articleData.items,
            categories: articleData.categories,
            config: articleData.config
        }
    }

    const parseArticleCategories = (rawCategories) => {
        for(const category of rawCategories) {
            if(category.locales) {
                category.singular = getTranslation(category.locales, 'singular')
                category.plural = getTranslation(category.locales, 'plural')
            }
        }

        return rawCategories
    }

    const hasAnyItemWithValue = (rawItems) => {
        return rawItems.some(item => item.value)
    }

    const hasAnyItemWithLocaleFieldNamed = (rawItems, fieldName) => {
        return rawItems.some(item => getTranslation(item['locales'], fieldName, true))
    }

    const sortArticleItemsByDateDesc = (rawItems) => {
        rawItems.sort((a, b) => {
            const dateA = a.dates?.start ? new Date(a.dates.start) : null
            const dateB = b.dates?.start ? new Date(b.dates.start) : null

            if (!dateA && !dateB) return 0
            if (!dateA) return 1
            if (!dateB) return -1

            return dateB - dateA
        })
    }

    const parseArticleItems = (rawItems, options) => {
        options = options || {}
        options.hideDayFromDates = options.hideDayFromDates || true

        return rawItems.map((item) => {
            const locales = item.locales || {}
            const icon = item.icon || {}
            const dates = item.dates
            const media = item.media

            // Extract default links array
            let links = []
            if (Array.isArray(item.links)) {
                links = item.links.map(link => ({
                    href: link.href,
                    hrefLabel: getString(link.string || 'link'),
                    faIcon: link.faIcon
                }))
            }
            // Fallback: detect a localized 'button' field
            const buttonObj = (locales[selectedLanguageId] && locales[selectedLanguageId].button) || (locales.en && locales.en.button)
            if (buttonObj && buttonObj.link) {
                links.push({
                    href: buttonObj.link,
                    hrefLabel: buttonObj.text || getString('link'),
                    faIcon: icon.fa
                })
            }

            const parsedItem = {
                title: utils.parseJsonText(getTranslation(locales, 'title', true)),
                info: utils.parseJsonText(getTranslation(locales, 'info', true)),
                text: utils.parseJsonText(getTranslation(locales, 'text', true)),
                tags: getTranslation(locales, 'tags', true) || [],

                img: icon.img ? utils.resolvePath(icon.img) : null,
                faIcon: icon.fa || null,
                faIconColors: icon.faColors || null,

                dateInterval: dates
                    ? utils.formatDateInterval(dates.start, dates.end, selectedLanguageId, true, options.hideDayFromDates)
                    : null,
                dateStarted: dates?.start,
                dateEnded: dates?.end,

                links,
                mediaOptions: [],

                categoryId: item.categoryId,
                value: item.value
            }

            // Media options
            if(media) {
                const {screenshots, youtubeVideo} = media
                if(screenshots?.images?.length) {
                    parsedItem.mediaOptions.push({
                        id: 'gallery',
                        target: screenshots,
                        tooltip: getString('open_gallery'),
                        faIcon: 'fa-solid fa-camera'
                    })
                }
                if(youtubeVideo) {
                    parsedItem.mediaOptions.push({
                        id: 'youtube',
                        target: youtubeVideo,
                        tooltip: getString('watch_video'),
                        faIcon: 'fa-brands fa-youtube'
                    })
                }
            }

            // Helper fields
            parsedItem.firstLink = parsedItem.links.length ? parsedItem.links[0] : null

            return parsedItem
        })
    }

    const bindItemsToCategories = (parsedItems, parsedCategories) => {
        parsedItems.forEach(item => {
            item.category = parsedCategories.find(category => category.id === item.categoryId)
        })
    }

    // Other formatters (unchanged)
    const formatForGrid = (rawItems) => {
        const parsedItems = parseArticleItems(rawItems)
        return parsedItems.map(item => ({
            ...item,
            value: item.value || item.info,
            label: item.value || item.info,
            href: item.firstLink?.href
        }))
    }

    const formatForActivityList = (rawItems) => {
        const parsedItems = parseArticleItems(rawItems)
        return parsedItems.map(item => ({
            ...item,
            title: item.title + (item.tags.length ? ' – ' : ''),
            progress: item.value != null ? Number(item.value) : null,
            description: item.info,
            fallbackIcon: item.faIcon,
            fallbackIconColors: item.faIconColors
        }))
    }

    const formatForThreads = (rawItems) => {
        const parsedItems = parseArticleItems(rawItems)
        return parsedItems.map(item => ({
            ...item,
            date: item.dateInterval,
            place: item.info,
            description: item.text,
            href: item.firstLink?.href,
            hrefLabel: item.firstLink?.hrefLabel
        }))
    }

    const formatForTimeline = (rawItems) => {
        return parseArticleItems(rawItems)
    }

    return {
        parseArticleData,
        parseArticleCategories,
        hasAnyItemWithValue,
        hasAnyItemWithLocaleFieldNamed,
        sortArticleItemsByDateDesc,
        parseArticleItems,
        bindItemsToCategories,
        formatForGrid,
        formatForActivityList,
        formatForThreads,
        formatForTimeline
    }
}
