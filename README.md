# Notes for andrew: 

# FINDME
> you can search through the project for findme w/ are sections i thought you would want to change either now or in the future so i tried to make the easy too :) 


# HomePage 

### Artist Statement
> use this as your place to write a 1-2 para decription of your self :) 

[Home.jsx](/client/src/pages/Home.jsx) search for ``` FINDME Artist Statement ```

### Skills List
> this is the 4 skills in your about section of your home page you can switch this to what ever you want 

[Home.jsx](/client/src/pages/Home.jsx) search for ``` FINDME Skills List ```

this represent 1 card block: 
```js
<div className="skill-item">
    <div className="skill-name">title</div> {/* name of the skill over aching usually*/}
    <div className="skill-detail">description 1 &amp; desc 2</div> {/* smaller deciptions */}
</div>

```
### Contact Links 
> this is the links you want people to use to reach out to you tbh even if someone want to hire you the chances of them using this is low but they are here if they do :) 

[Home.jsx](/client/src/pages/Home.jsx) search for ``` FINDME Contact Links ```


```js
<a
    href="www.something.com" {/*put the link you want to go here */}
    target="_blank"
    rel="noopener noreferrer"
    className="contact-link"
>
    NAME wjifw {/*put the name you want to show up on the site here */}
</a>
```

## AboutPage

### Artist Statement
> this is the artist statement on the about page change this probaly to something more personal 

[About.jsx](/client/src/pages/About.jsx) search for ``` FINDME Artist Statement ```


### Experience 
>this is the timeline on the about page w/ is meant to be used for like jobs clubs etc ... can be changed :) 


[About.jsx](/client/src/pages/About.jsx) search for ``` FINDME Experience ```
> this is experience section changing existing items should be self explanitory. 

[About.jsx](/client/src/pages/About.jsx) search for ``` FINDME TIMELINE END ```
> this will give you the point on the timeline where you can add the next item 

this is the template for if you want to add a new item to the experience section 

```js
<div className="timeline-item">
<div className="timeline-marker" />
<div className="timeline-content">
    <h3 className="timeline-title">TITLE</h3> {/*add timeline name here ex. job title or sthing*/}
    <p className="timeline-desc"> {/*this should be like the bullet points on your resume :) */}
        Description 
    </p>
</div>
</div>
```

# Skills List 
> i thought it was best to split this into 2 sections digital and physical cards are the same as the ones on the home page 

[About.jsx](/client/src/pages/About.jsx) search for ``` FINDME Skills List ```



new skill template :) for if you want to add new skills BE CAREFULL TO ADD THEM TO THE CORRECTION SECTION AND IN A SECTION !
``` js
<div className="skill-item">
    <div className="skill-name">Fusion 360</div>
    <div className="skill-detail">Parametric CAD, CAM</div>
</div>

```











# Harrison Default Web Template

A full-stack web application template with React frontend and Express backend.

## Project Structure

```
HarrisonDefaultWeb/
├── client/          # React frontend (Vite + React 19)
├── server/          # Express backend
└── package.json     # Root package with concurrent scripts
```

## Tech Stack

### Frontend (Client)
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting

### Backend (Server)
- **Express 5** - Web framework
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-restart

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/harri665/HarrisonWebDefault.git
cd HarrisonDefaultWeb
```

2. Install dependencies for all packages:
```bash
npm install
npm run install:all
```

### Development

Start both client and server concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
npm run client    # Start frontend only
npm run server    # Start backend only
```

The client will typically run on `http://localhost:5173` and the server on `http://localhost:3001` (or ports configured in your setup).

To change port for client or servercreate a .env in the respective folder with: 
```env
PORT: #port number here 
```


## Available Scripts

### Root Level
- `npm run dev` - Run both client and server concurrently
- `npm run client` - Run client development server only
- `npm run server` - Run server development server only
- `npm run install:all` - Install dependencies in both client and server

### Client (`cd client`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server (`cd server`)
- `npm run dev` - Start server with nodemon (auto-restart)
- `npm start` - Start server in production mode


