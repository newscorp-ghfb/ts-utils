///<reference types="jest"/>
import * as mockfs from 'mock-fs'
// import * as fs from 'fs'
// import * as path from 'path'
import _ from 'lodash';
import { AbsPath, MockFSHelper } from "../index"
import { GitLogic } from '../git_logic';
import * as tmp from 'tmp';

tmp.setGracefulCleanup()

let tmpdir_obj: tmp.SynchrounousResult
let tmpdir: AbsPath
let projdir: AbsPath


beforeEach(async () => {
    tmpdir_obj = tmp.dirSync({ unsafeCleanup: true })
    tmpdir = new AbsPath(tmpdir_obj.name)
    console.log("*** Creating temp dir:", tmpdir.realpath)
    init_simple_repo()
})

afterEach(async () => {
    tmpdir_obj.removeCallback()
})


function init_simple_repo() {
    projdir = tmpdir.add('proj')
    const gitbase = projdir.add('.git')
    gitbase.add('objects').add('info').mkdirs()
    gitbase.add('objects').add('pack').mkdirs()
    gitbase.add('refs').add('heads').mkdirs()
    gitbase.add('refs').add('tags').mkdirs()
    gitbase.add('HEAD').saveStrSync('ref: refs/heads/master')

    tmpdir.add('non_proj').mkdirs()
}


describe('git logic', () => {
    test('repo detection', () => {
        init_simple_repo()
        let gl = new GitLogic(tmpdir.add('proj'));
        expect(gl.is_repo).toBeTruthy()

        let gl2 = new GitLogic(new AbsPath('/non_proj'));
        expect(gl2.is_repo).toBeFalsy()
    })

    test('check ignore', () => {
        let gl = new GitLogic(tmpdir.add('proj'));
        expect(gl.is_repo).toBeTruthy()

        projdir.add('.gitignore').saveStrSync('ignored')
        projdir.add('regularfile').saveStrSync('this file is not ignored')
        projdir.add('ignored').saveStrSync('this file is ignored')
        projdir.add('subdir').mkdirs()
        projdir.add('subdir').add('regfile2').saveStrSync('this file should not be ignored')
        projdir.add('subdir').add('ignored').saveStrSync('this file should be ignored')

        expect(gl.check_ignore(projdir.add('ignored').abspath)).toBeTruthy()
        expect(gl.check_ignore(projdir.add('subdir/ignored').abspath)).toBeTruthy()
        expect(gl.check_ignore(projdir.add('regularfile').abspath)).toBeFalsy()
        expect(gl.check_ignore(projdir.add('subdir/regfile2').abspath)).toBeFalsy()
    })
})