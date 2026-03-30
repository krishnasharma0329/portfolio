import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUtils } from "/src/helpers/utils.js";
import { useEmails } from "/src/helpers/emails.js";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

const Status = {
    NOT_LOADED: 0,
    LOADED: 1
};

export const DataProvider = ({ children }) => {
    const utils = useUtils();
    const emails = useEmails();

    const [status, setStatus] = useState(Status.NOT_LOADED);
    const [jsonData, setJsonData] = useState({
        settings: {},
        strings: {},
        sections: [],
        categories: []
    });

    useEffect(() => {
        loadInitialData().catch(console.error);
    }, []);

    useEffect(() => {
        if (jsonData.settings.emailjs) {
            emails.init(jsonData.settings.emailjs);
        }
    }, [jsonData.settings]);

    const loadInitialData = async () => {
        try {
            // Load core configuration files first
            const [settings, strings, structure] = await Promise.all([
                loadJson("/data/settings.json"),
                loadJson("/data/strings.json"),
                loadJson("/data/structure.json"),
            ]);

            // Process categories and sections
            const categories = structure.categories;
            const allSections = structure.sections;
            
            // Find and load critical section (About page in home category)
            const criticalSection = allSections.find(s => s.categoryId === 'home');
            const nonCriticalSections = allSections.filter(s => s.categoryId !== 'home');

            // Load critical section content
            if (criticalSection) {
                criticalSection.content = await loadJson(criticalSection.jsonPath);
            }

            // Set initial state with loaded data
            setJsonData({
                settings,
                strings,
                categories: categories.filter(c => allSections.some(s => s.categoryId === c.id)),
                sections: allSections.map(s => ({
                    ...s,
                    content: s.id === criticalSection?.id ? criticalSection.content : null
                }))
            });

            setStatus(Status.LOADED);

            // Load remaining sections in background
            if (nonCriticalSections.length > 0) {
                loadBackgroundData(nonCriticalSections);
            }
        } catch (error) {
            console.error('Initial data loading failed:', error);
        }
    };

    const loadBackgroundData = async (sections) => {
        try {
            await Promise.all(sections.map(async (section) => {
                const content = await loadJson(section.jsonPath);
                setJsonData(prev => ({
                    ...prev,
                    sections: prev.sections.map(s => 
                        s.id === section.id ? { ...s, content } : s
                    )
                }));
            }));
        } catch (error) {
            console.error('Background data loading failed:', error);
        }
    };

    const loadJson = async (path) => {
        const actualPath = utils.resolvePath(path);
        const response = await fetch(actualPath);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.json();
    };

    // Helper methods
    const getSettings = () => jsonData.settings;
    const getStrings = () => jsonData.strings;
    const getSections = () => jsonData.sections;
    const getCategories = () => jsonData.categories;
    const getCategorySections = (category) => 
        category ? jsonData.sections.filter(s => s.categoryId === category.id) : [];
    const listImagesForCache = () => [/*...unchanged...*/];

    return (
        <DataContext.Provider value={{
            getSettings,
            getStrings,
            getSections,
            getCategories,
            getCategorySections,
            listImagesForCache
        }}>
            {status === Status.LOADED && children}
        </DataContext.Provider>
    );
};