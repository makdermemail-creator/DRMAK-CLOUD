'use client';
import * as React from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type PerformanceMetric = {
    name: string;
    reach: number;
    engagement: number;
};

export type FollowerMetric = {
    name: string;
    followers: number;
};

export type SummaryMetrics = {
    totalReach: number;
    newFollowers: number;
    engagementRate: number;
    activeCampaigns: number;
    reachChange: number;
    followerChange: number;
    engagementChange: number;
};

export function useAnalyticsData() {
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [performanceData, setPerformanceData] = React.useState<PerformanceMetric[]>([]);
    const [followerGrowthData, setFollowerGrowthData] = React.useState<FollowerMetric[]>([]);
    const [summaryMetrics, setSummaryMetrics] = React.useState<SummaryMetrics>({
        totalReach: 0,
        newFollowers: 0,
        engagementRate: 0,
        activeCampaigns: 0,
        reachChange: 0,
        followerChange: 0,
        engagementChange: 0,
    });

    const fetchData = React.useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Get sheet URL from Firestore
            const docRef = doc(firestore, 'settings', 'socialMedia');
            const snap = await getDoc(docRef);

            if (!snap.exists() || !snap.data().googleSheetLink) {
                // Return mock data fallback or empty state if no URL configured
                setIsLoading(false);
                return;
            }

            const sheetUrl = snap.data().googleSheetLink;

            // 2. Fetch CSV via proxy
            const proxyUrl = `/api/sheet-proxy?url=${encodeURIComponent(sheetUrl)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data. Check sheet permissions.');
            }

            const csvText = await response.text();

            // 3. Simple CSV Parsing (handling quotes)
            const rows = csvText.split('\n').filter(line => line.trim()).map(row => {
                const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
                const cells = [];
                let match;
                while ((match = regex.exec(row)) !== null) {
                    cells.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
                }
                return cells.map(cell => cell?.trim() || '');
            });

            if (rows.length < 2) {
                setIsLoading(false);
                return;
            }

            const headers = rows[0].map(h => h.toLowerCase().trim());
            console.log('Analytics headers detected:', headers);

            // 4. Map columns
            const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('day'));
            const reachIdx = headers.findIndex(h => h.includes('reach') || h.includes('views'));
            const engagementIdx = headers.findIndex(h => h.includes('engagement') || h.includes('interaction'));
            const followersIdx = headers.findIndex(h => h.includes('follower') || h.includes('subs'));

            const dataRows = rows.slice(1);

            // Performance Data (Daily Reach/Engagement)
            const performance = dataRows.slice(-7).map(row => ({
                name: dateIdx !== -1 ? row[dateIdx] : 'N/A',
                reach: reachIdx !== -1 ? Number(row[reachIdx]) || 0 : 0,
                engagement: engagementIdx !== -1 ? Number(row[engagementIdx]) || 0 : 0,
            }));
            setPerformanceData(performance);

            // Follower Growth (Weekly)
            const followerGrowth = dataRows.filter((_, i) => i % 7 === 0 || i === dataRows.length - 1).slice(-5).map((row, i) => ({
                name: `Week ${i + 1}`,
                followers: followersIdx !== -1 ? Number(row[followersIdx]) || 0 : 0,
            }));
            setFollowerGrowthData(followerGrowth);

            // Summary Metrics
            const latestRow = dataRows[dataRows.length - 1];
            const prevRow = dataRows.length > 1 ? dataRows[dataRows.length - 2] : null;

            const totalReachVal = reachIdx !== -1 ? dataRows.reduce((acc, row) => acc + (Number(row[reachIdx]) || 0), 0) : 0;
            const latestFollowers = followersIdx !== -1 ? Number(latestRow[followersIdx]) || 0 : 0;
            const prevFollowers = prevRow && followersIdx !== -1 ? Number(prevRow[followersIdx]) || 0 : 0;
            const newFollowersVal = Math.max(0, latestFollowers - (dataRows[0][followersIdx] ? Number(dataRows[0][followersIdx]) : latestFollowers));

            const totalEngagement = engagementIdx !== -1 ? dataRows.reduce((acc, row) => acc + (Number(row[engagementIdx]) || 0), 0) : 0;
            const avgEngagementRate = totalReachVal > 0 ? (totalEngagement / totalReachVal) * 100 : 0;

            setSummaryMetrics({
                totalReach: totalReachVal,
                newFollowers: newFollowersVal,
                engagementRate: Number(avgEngagementRate.toFixed(1)),
                activeCampaigns: 12, // Placeholder or fetch if available
                reachChange: 20.1, // Sample placeholder for now
                followerChange: 180.1,
                engagementChange: -2,
            });

        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [firestore]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        isLoading,
        error,
        performanceData,
        followerGrowthData,
        summaryMetrics,
        refresh: fetchData
    };
}
