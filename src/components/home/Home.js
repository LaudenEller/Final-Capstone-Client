import { Box, Grid, Typography } from "@mui/material"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getAssetClases, getCountries, getEsgConcerns, getIndustries, searchName } from "../filters/FiltersManager"
import { filterFunds, getFundList, getWatchList } from "../funds/FundManager"
import { getFavorites, getIssuer, getIssuerList } from "../issuers/IssuerManager"
import { getUsers } from "../users/UserManager"
import { FundModal } from "../modal/FundModal"
import { RecModal } from "../modal/RecModal"
import { IssuerModal } from "../modal/IssuerModal"
import { AgGridReact } from 'ag-grid-react'
// import { CSSTransitionGroup } from 'react-transition-group'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'
import { getRecommendations } from "../recommendations/RecommendationManager"
import { RecList } from "../recommendations/RecommendationList"
import { WatchList } from "../watchlist/WatchList"
import { FavoritesList } from "../favorites/Favorites"



export const Home = () => {
    
    // Refreshes resources
    const [refreshRecs, setRefreshRecs] = useState(false)
    const [refreshFunds, setRefreshFunds] = useState(false)
    const [refreshFaves, setRefreshFaves] = useState(false)
    
    // var CSSTransitionGroup = require('react-transition-group')
    
    // HELP: How can I get these to load onto the JSX without it being clunky? 
    // (Try: ternary operator with "loading div" and db content) - NOW ADD ANIMATION
    // State for objects from db 
    const [recs, setRecs] = useState([])
    const [favorites, setFavorites] = useState([])
    const [funds, setFunds] = useState([])
    const [users, setUsers] = useState([])
    const [issuers, setIssuers] = useState([])
    const [assets, setAssets] = useState([])
    const [industries, setIndustries] = useState([])
    const [countries, setCountries] = useState([])
    const [esgConcerns, setEsgConcerns] = useState([])

    // State for button and modal controls
    const [open, setOpen] = useState(false);
    const [openIssuer, setOpenIssuer] = useState(false);
    const [openRec, setOpenRec] = useState(false);
    const [faveButton, setFaveButton] = useState(true)
    const [watchButton, setWatchButton] = useState(true)
    const [load, updateLoad] = useState(false)

    // State for handling local storage
    // Passes objects to modals
    const [content, setContent] = useState({})
    // Saves checkbox selection
    const [concernChecks, setConcernChecks] = useState({})
    // Passes a fund Id to the rec modal
    const [recId, setRecId] = useState(0)
    // Saves filter input for the query params string
    const [filter, setFilter] = useState(
        {
            name: [],
            issuer: [],
            assetclass: [],
            industry: [],
            country: [],
            esg: []
        }
    )

    // Sets columns for AG Grid
    const [columnDefs, setColumnDefs] = useState([
        { field: "name" },
        { field: "issuer.name" },
        { field: "country.country" },
        { field: "asset_rating" },
        { field: "esg_rating" },
        { field: "aclass.aclass" },
        { field: "industry.industry" },
        { field: "esg_concern.concern" },
        // Add a grouped field for the esg concerns 
    ])

    // Sets column behavior for AG Grid
    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        animateRows: true,
        resizable: true
    }), [])

    // Add ternary operator that loads "loading div" until resources arrive from db
    // Add animation to initial and subsequent renders
    // const [load, finishLoad] = useState(false)


    // Refreshing resources from db
    useEffect(() => {
        getFavorites()
            .then(setFavorites)
    },
        [refreshFaves])

    useEffect(() => {
        getRecommendations()
            .then((d => setRecs(d)))
    },
        [refreshRecs])
    
        useEffect(() => {
        getWatchList()
            .then((d) => setFunds(d))
    },
        [refreshFunds])


    // Initial render
    useEffect(() => {
        getFavorites()
            .then(setFavorites)
        getRecommendations()
            .then((d => setRecs(d)))
        getWatchList()
            .then((d) => setFunds(d))
        getUsers()
            .then(setUsers)
        getFundList()
            .then(setFunds)
        getIssuerList()
            .then(setIssuers)
        getIndustries()
            .then(setIndustries)
        getCountries()
            .then(setCountries)
        getAssetClases()
            .then(setAssets)
        getEsgConcerns()
            .then(setEsgConcerns)
    },
        [])

    useEffect(
        () => {
            if (funds.length > 0) {
                updateLoad(true)
            }
        },
        [funds]
    )

    // Refreshes funds when the user changes the filters
    useEffect(() => {
        getResources()
    },
        [filter]
    )

    // Saves ESG filter input to state
    const handleCheckBoxChange = (id) => {
        let copy = { ...filter }
        if (copy['esg'].includes(id)) {
            copy.esg.splice(id)
            setFilter(copy)
        }
        else {
            copy.esg.push(id)
            setFilter(copy)
        }
    }

    // Send db request with any query params that are in state
    const getResources = () => {
        let queryString = "/funds?"
        for (let key in filter) {
            if (filter[key].length > 0) {
                if (queryString === "/funds?") {
                    queryString += `${key}=`
                }
                else {
                    queryString += `&${key}=`
                }
                if (key === "esg") {
                    for (let i = 0; i < filter.esg.length; i++) {
                        if (filter.esg[filter.esg.length - 1] === filter.esg[i]) {
                            queryString += `${filter.esg[i]}`
                        }
                        else {
                            queryString += `${filter.esg[i]},`
                        }
                    }
                }
                else {
                    filter[key].forEach((i) => {
                        queryString += `${i}`
                    })
                }
            }
        }
        filterFunds(queryString)
            .then(setFunds)
    }

    // Clears filter state
    const resetFilter = () => {
        setFilter(
            {
                name: [],
                issuer: [],
                assetclass: [],
                industry: [],
                esg: []
            }
        )
        setConcernChecks([])
    }

    // Opens modals
    const cellClickedListener = useCallback(e => {
        if (e.column.colId === "name") {
            handleFundOpen(e.data)
        }
        else if (e.column.colId === "issuer.name") {
            handleOpenIssuer(e.data.issuer.id)
        }
    })

    // Opens fund modal
    const handleFundOpen = (f) => {
        setContent(f)
        setOpen(true);
    }

    // Opens issuer modal
    const handleOpenIssuer = (x) => {
        setOpen(false);
        getIssuer(x)
            .then((i) => setContent(i))
            .then(() => setOpenIssuer(!openIssuer))
    };

    return (
        <>
            {/* Modals */}
            {
                open != 0 ? <FundModal open={open} setOpen={setOpen} setRecId={setRecId} openIssuer={openIssuer} setOpenIssuer={setOpenIssuer} content={content} setContent={setContent} users={users} watchButton={watchButton} setWatchButton={setWatchButton} openRec={openRec} setOpenRec={setOpenRec} /> : ""
            }
            {
                openRec != 0 ? <RecModal openRec={openRec} setOpenRec={setOpenRec} recId={recId} content={content} /> : ""
            }
            {
                openIssuer != 0 ? <IssuerModal favorites={favorites} setRefreshFaves={setRefreshFaves} refreshFaves={refreshFaves} openIssuer={openIssuer} setOpenIssuer={setOpenIssuer} setOpen={setOpen} setOpenRec={setOpenRec} content={content} faveButton={faveButton} setFaveButton={setFaveButton} /> : ""
            }
            {load ? <>
                {/* JSX */}
                <Box className="page_content_box" sx={{ height: "541px", border: "solid 1px #babfc7" }}>
                    <Box className="grid_box" sx={{ flexGrow: 1 }}>
                        <Grid container spacing={1}>
                            {/* container for filters */}
                            <Grid item container xs={1.9} className="filter_box" sx={{
                                direction: "column",
                                height: "539px",
                                alignContent: "space-evenly",
                                border: "1px, solid, black",
                                backgroundColor: "#fff",
                                marginLeft: "9px",
                                marginTop: "9px"
                            }}>
                                {/* filter by name jsx */}
                                <Grid item className="filter--search" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    <fieldset id="nameSearchField">

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="name..."
                                            onChange={e => {
                                                e.preventDefault()
                                                let copy = { ...filter }
                                                copy.name.push(e.currentTarget.previousElementSibling.value)
                                                setFilter(copy)
                                            }}
                                        />
                                    </fieldset>
                                </Grid>
                                <Grid item className="filter--issuer" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    {/* filter by issuer jsx */}
                                    <fieldset>
                                        <select
                                            className="issuerDropdown"
                                            name="issuerId"
                                            onChange={e => {
                                                e.preventDefault()
                                                let copy = { ...filter }
                                                copy.issuer.push(e.target.value)
                                                console.log(copy)
                                                setFilter(copy)
                                            }}
                                        >
                                            <option name="issuerId" hidden value="0">
                                                Filter By issuer
                                            </option>
                                            {issuers?.map((i) => {
                                                return (
                                                    <option key={i.id} name="issuerId" value={i.id}>
                                                        {i.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </fieldset>
                                </Grid>
                                <Grid item className="filter--asset_class" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    {/* filter by asset class jsx */}
                                    <fieldset>
                                        <select
                                            className="asset_class_dropdown"
                                            name="asset_class_id"
                                            onChange={e => {
                                                e.preventDefault()
                                                let copy = { ...filter }
                                                copy.assetclass.push(e.target.value)
                                                console.log(copy)
                                                setFilter(copy)
                                            }}
                                        >
                                            <option name="asset_class_id" hidden value="0">
                                                Filter By asset class
                                            </option>
                                            {assets?.map((a) => {
                                                return (
                                                    <option key={a.id} name="asset_class_id" value={a.id}>
                                                        {a.aclass}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </fieldset>
                                </Grid>
                                <Grid item className="filter--industry" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    <fieldset className="form-group">
                                        <select
                                            className="industry_dropdown"
                                            name="industry_id"
                                            onChange={e => {
                                                e.preventDefault()
                                                let copy = { ...filter }
                                                copy.industry.push(e.target.value)
                                                setFilter(copy)
                                            }}
                                        >
                                            <option name="industry_id" hidden value="0">
                                                Filter By industry
                                            </option>
                                            {industries?.map((i) => {
                                                return (
                                                    <option key={i.id} name="industry_id" value={i.id}>
                                                        {i.industry}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </fieldset>
                                </Grid>
                                <Grid item className="filter--country" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    <fieldset className="form-group">
                                        <select
                                            className="country_dropdown"
                                            name="country_id"
                                            onChange={e => {
                                                e.preventDefault()
                                                let copy = { ...filter }
                                                copy.country.push(e.target.value)
                                                setFilter(copy)
                                            }}
                                        >
                                            <option name="country_id" hidden value="0">
                                                Filter By country
                                            </option>
                                            {countries?.map((c) => {
                                                return (
                                                    <option key={c.id} name="country_id" value={c.id}>
                                                        {c.country}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </fieldset>
                                </Grid>
                                <Grid item className="filter--esg" sx={{ width: "240px", backgroundColor: "#f8f8f8" }}>
                                    <fieldset className="form-group">
                                        <Typography sx={{ fontWeight: "bold" }}>Filter by ESG Sector</Typography>
                                        {esgConcerns?.map((ec) => {
                                            return (
                                                <>
                                                    <div className="esgCheckBox" key={`esgCheckBox--${ec.id}`}>
                                                        <div autoComplete="off" noValidate className="div">
                                                            <label>{ec.concern}</label>
                                                            <input
                                                                type="checkbox"
                                                                checked={concernChecks[`${ec.id}`]}
                                                                value={ec.id}
                                                                onChange={
                                                                    e => { handleCheckBoxChange(e.target.value) }}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        })}</fieldset>
                                </Grid>
                                <Grid item className="filter--button" sx={{ width: "240px" }}>
                                    <button onClick={() => resetFilter()}>Reset Filters</button>
                                </Grid>
                            </Grid>
                            {/* container for returned funds */}
                            <Grid item className="ag-theme-alpine" sx={{ height: 550, paddingLeft: 0, marginLeft: 0, }} xs={10}>
                                {/* <CSSTransitionGroup 
                     transitionName="example"
                     transitionAppear={true}
                     transitionAppearTimeout={500}
                     transitionEnterTimeout={500}
                     transitionLeaveTimeout={300}> */}
                                <AgGridReact
                                    onCellClicked={cellClickedListener}
                                    rowData={funds}
                                    columnDefs={columnDefs}
                                    defaultColDef={defaultColDef}
                                    animateRows={true}
                                />
                                {/* </CSSTransitionGroup> */}
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
                <Box className="all_content_box" >
                    <Box className="sub_content_box" sx={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", border: "solid 1px black", height: "600px", overflow: "hidden", backgroundColor: "#f3f6f3" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", overflow: "scroll", backgroundColor: "#f8ffff", border: "solid 1px black", marginTop: "25px", marginBottom: "25px" }}>
                            {/* Rec List Column */}
                            <RecList recs={recs} refreshRecs={refreshRecs} setRefreshRecs={setRefreshRecs} refreshFunds={refreshFunds} setRefreshFunds={setRefreshFunds} />
                        </Box>
                        {/* Watch List Column */}
                        <Box sx={{ display: "flex", flexDirection: "column", overflow: "scroll", backgroundColor: "#f8ffff", border: "solid 1px black", marginTop: "25px", marginBottom: "25px" }} className="funds_Box">
                            <WatchList funds={funds} open={open} openIssuer={openIssuer} refreshFunds={refreshFunds} setContent={setContent} setOpen={setOpen} setOpenIssuer={setOpenIssuer} setRefreshFunds={setRefreshFunds} />
                        </Box>
                        {/* Favorites List Column */}
                        <Box sx={{ display: "flex", flexDirection: "column", overflow: "scroll", backgroundColor: "#f8ffff", border: "solid 1px black", marginTop: "25px", marginBottom: "25px" }} className="favorites_container">
                            <FavoritesList favorites={favorites} setRefreshFaves={setRefreshFaves} refreshFaves={refreshFaves} />
                        </Box>
                    </Box>
                </Box>
            </>
                : <div>JSX Loading</div>
            } </>
    )
}