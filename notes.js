import fs from 'fs'

const getNotes = function getNotes(){
    return "Your notes ... ";
}

const addNotes = function (title, body){
    const notes = loadNotes();
    const duplicateNotes = notes.filter(function (note){
        return note.title === title
    })
    if(duplicateNotes.length === 0 ){
        notes.push(
            {
                title : title,
                body : body
            }
        )
        saveNote(notes)
        console.log('New note added!');
    }else{
        console.log(('Note title taken!'))
    }
}

const removeNotes = function (title){
    const notes = loadNotes();
    const duplicateNotes = notes.filter(function (note){
        return note.title === title
    })
    if(duplicateNotes.length === 0){
        console.log('This note were not exist!')
    }else{
        const newnotes = notes.filter(note => note.title !== title)
        console.log(newnotes)
        saveNote(newnotes)
        console.log('Removed this note!')
    }
}

const saveNote = function(notes){
    const dataJson = JSON.stringify(notes)
    fs.writeFileSync('notes.json', dataJson)
}

const loadNotes = function(){
    try{
        const dataBuffer = fs.readFileSync('notes.json')
        const dataJson = dataBuffer.toString()
        return JSON.parse(dataJson)
    }catch{
        return []
    }
}
export { getNotes, addNotes, removeNotes };
