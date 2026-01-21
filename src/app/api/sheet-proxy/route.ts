import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sheetUrl = searchParams.get('url');

        if (!sheetUrl) {
            return NextResponse.json(
                { error: 'Missing url parameter' },
                { status: 400 }
            );
        }

        // Validate it's a Google Sheets URL
        if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
            return NextResponse.json(
                { error: 'Invalid Google Sheets URL' },
                { status: 400 }
            );
        }

        // Extract sheet ID and construct export URL
        const sheetIdMatch = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
        if (!sheetIdMatch) {
            return NextResponse.json(
                { error: 'Could not extract sheet ID from URL' },
                { status: 400 }
            );
        }

        const sheetId = sheetIdMatch[1];
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

        // Fetch the CSV data server-side (bypasses CORS)
        const response = await fetch(exportUrl);

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch sheet data. Ensure the sheet is publicly accessible.' },
                { status: response.status }
            );
        }

        const csvData = await response.text();

        // Return the CSV data as plain text
        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
            },
        });
    } catch (error) {
        console.error('Sheet proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
